const targets = [
  { target: "bun-darwin-arm64", outfile: "../big-file-checker-macos-arm64", platform: "darwin", arch: "arm64" },
  { target: "bun-darwin-x64", outfile: "../big-file-checker-macos-x64", platform: "darwin", arch: "x64" },
  { target: "bun-linux-x64", outfile: "../big-file-checker-linux", platform: "linux", arch: "x64" },
  { target: "bun-windows-x64", outfile: "../big-file-checker-win.exe", platform: "win32", arch: "x64" },
];

for (const { target, outfile, platform, arch } of targets) {
  console.log(`📦 Building for ${target}...`);
  
  const result = await Bun.build({
    entrypoints: ["./index.ts"],
    target: "bun", // We use compile later
    minify: true,
    plugins: [
      {
        name: "opentui-fix",
        setup(build) {
          // Intercept the dynamic import in opentui/core
          build.onResolve({ filter: /@opentui\/core-.*\/index\.ts/ }, (args) => {
             // If it matches the pattern, we can try to redirect it
             return null; 
          });
        },
      },
    ],
  });

  if (!result.success) {
    console.error(`❌ Build failed for ${target}`);
    console.error(result.logs);
    continue;
  }

  // Use Bun.spawn to run the compile command on the bundled file?
  // Actually Bun compile can take a bundle.
}
