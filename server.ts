import Cloudflare from "cloudflare";
import { readLines } from "https://deno.land/std/io/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const DEFAULT_PORT = 8080;
const router = new Router();

let cloudflare: Cloudflare | null = null;

// async function generateTunnelWithMyDomain(): Promise<string> {
//     const tunnel = await cloudflare.zeroTrust.tunnels.create({
//         name: Deno.env.get("GITHUB_REPOSITORY")?.split("/")[1] ?? "",
//         account_id: Deno.env.get("CLOUDFLARE_ACCOUNT_ID") ?? "",
//         tunnel_secret: encodeBase64("password2025!!")
//     });

//     console.log("Tunnel created: ");
//     console.log(tunnel);
//     return tunnel.id;
// }


async function generateTempTunnel() {

    const urlRegex = /(https:\/\/[a-zA-Z0-9.\-]+\.trycloudflare\.com)/;

    const cloudflaredProcess = Deno.run({
    cmd: ["cloudflared", "tunnel", "--url", "localhost:"+DEFAULT_PORT],
    stdout: "piped",
    stderr: "piped",
    });

    console.log("Cloudflared process started. Generating temp tunnel...");

    let tryCloudflareUrl = null;
    for await (const line of readLines(cloudflaredProcess.stderr)) {
        const match = line.match(urlRegex);
        if (match) {
            tryCloudflareUrl = match[1];
            console.log("Generated tunnel: ", tryCloudflareUrl);
            return tryCloudflareUrl;
        }

    }
    return tryCloudflareUrl;
}


async function updateKV(tempTunnel: string) {
    try {
        const repoName = Deno.env.get("GITHUB_REPOSITORY")?.split("/")[1] ?? "";
        console.log("Repo name: ", repoName);
        console.log("Account ID: ", Deno.env.get("CLOUDFLARE_ACCOUNT_ID"));
        console.log("API Key: ", Deno.env.get("CLOUDFLARE_API_KEY"));
        console.log("API Email: ", Deno.env.get("CLOUDFLARE_API_EMAIL"));
        console.log("URL: ", tempTunnel);

        cloudflare = new Cloudflare({
            apiToken: "JG3_-8qL4gMShrjOxH_jRbH71w9jJQeFo5IxFkMi"
        });

        await cloudflare.kv.namespaces.values.update("ee9905c7bfc045e98159d410532c9599", repoName, {
            account_id: Deno.env.get("CLOUDFLARE_ACCOUNT_ID") ?? "",
            metadata: '{"last_active": ' + Date.now() + '}',
            value: tempTunnel
        });

        console.log("Successfully added KV key-value pair: ", tempTunnel);
    } catch (error) {
        console.error("Failed to add key-value pair to KV: ", error);
    }
}

router.get("/ping", (context) => {
    context.response.status = 200;
    context.response.body = { message: "pong" };
});


router.post("/prompt", async (context) => {
    
    try {
        const body = await context.request.body.json();
        const prompt = body.value.q;

        if (!prompt) {
            context.response.status = 400;
            context.response.body = { error: "No prompt provided" };
            return;
        }

        // Aider command
        const cmd = [
            "aider",
            "--model",
            "deepseek/deepseek-coder",
            "--no-show-model-warnings",
            "--no-browser",
            "--yes",
            "--read",
            "CONVENTIONS.md",
            "--auto-commits",
            "--message",
            prompt,
        ];

        const currentWorkingDirectory = Deno.cwd();
        console.log("CWD:", currentWorkingDirectory);

        // 1) Run Aider
        const aiderProcess = Deno.run({
            cmd,
            cwd: currentWorkingDirectory,
            stdout: "piped",
            stderr: "piped",
        });

        const [aiderStatus, rawOutput, rawError] = await Promise.all([
            aiderProcess.status(),
            aiderProcess.output(),
            aiderProcess.stderrOutput(),
        ]);

        aiderProcess.close();

        const output = new TextDecoder().decode(rawOutput);
        const errorOutput = new TextDecoder().decode(rawError);

        if (!aiderStatus.success) {
            context.response.status = 500;
            context.response.body = {
                success: false,
                error: `Aider process exited with code ${aiderStatus.code}`,
                logs: errorOutput || output,
            };
            return;
        }

        console.log("Aider finished successfully. Now pushing changes...");

        // 2) If Aider succeeded, run git push origin master
        const gitPushProcess = Deno.run({
            cmd: ["git", "push", "origin", "master"],
            cwd: currentWorkingDirectory,
            stdout: "piped",
            stderr: "piped",
        });

        const [pushStatus, pushRawOutput, pushRawError] = await Promise.all([
            gitPushProcess.status(),
            gitPushProcess.output(),
            gitPushProcess.stderrOutput(),
        ]);

        gitPushProcess.close();

        const pushOutput = new TextDecoder().decode(pushRawOutput);
        const pushErrorOutput = new TextDecoder().decode(pushRawError);

        if (!pushStatus.success) {
            context.response.status = 500;
            context.response.body = {
                success: false,
                error: `git push exited with code ${pushStatus.code}`,
                logs: pushErrorOutput || pushOutput,
            };
            return;
        }

        // All good
        context.response.status = 200;
        context.response.body = {
            success: true,
            output: `${output}\n\nPUSH SUCCESS:\n${pushOutput}`,
        };
    } catch (err) {
        console.error("Invocation failed:", err);
        context.response.status = 500;
        context.response.body = {
            success: false,
            error: err.message,
        };
    }
});

//1. Get temp tunnel
const tempTunnel = await generateTempTunnel() ?? "";

//2. Update KV
await updateKV(tempTunnel);

//3. Launch server to listen for requests (prompts) in order to prepare AI
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

const port = Number(Deno.env.get("PORT")) || DEFAULT_PORT;
console.log(`Server running on port: ${port}`);
await app.listen({ port });
