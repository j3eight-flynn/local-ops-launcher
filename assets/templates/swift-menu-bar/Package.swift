// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ProjectLauncher",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "ProjectLauncher", targets: ["ProjectLauncher"])
    ],
    targets: [
        .executableTarget(name: "ProjectLauncher")
    ]
)
