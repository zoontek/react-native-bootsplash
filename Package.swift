// swift-tools-version: 6.0

import Foundation
import PackageDescription

// React Native autolinks this package under ios/build/generated/autolinking/libs/.
// Exclude unused checkout and npm entries from SwiftPM resource discovery.
let usedRootEntries: Set<String> = ["ios", "include", "Package.swift"]
let unusedRootEntries = try! FileManager.default.contentsOfDirectory(atPath: Context.packageDirectory)
    .filter { !usedRootEntries.contains($0) }
    .sorted()

let package = Package(
    name: "RNBootSplash",
    platforms: [.iOS("15.1")],
    products: [
        .library(name: "RNBootSplash", targets: ["RNBootSplash"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "RNBootSplash",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
            ],
            path: ".",
            exclude: ["ios/RNBootSplash.xcodeproj"] + unusedRootEntries,
            sources: ["ios"],
            publicHeadersPath: "include",
            cSettings: [
                .headerSearchPath("ios"),
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
            ],
            cxxSettings: [
                .headerSearchPath("ios"),
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("CoreGraphics"),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
