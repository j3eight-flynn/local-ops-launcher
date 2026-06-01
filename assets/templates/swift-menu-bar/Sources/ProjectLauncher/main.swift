import AppKit
import Foundation

struct Project: Codable {
    let name: String
    let shortName: String?
    let category: String?
    let launcherId: String?
    let serviceType: String?
    let projectPath: String?
    let hostedUrl: String?
    let localUrl: String?
    let healthUrl: String?
    let launcherCommandPath: String?
    let startCommand: String?
    let repairCommand: String?
    let preferredLaunch: String?
    let displayOrder: Int?
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private let menu = NSMenu()
    private var projects: [Project] = []

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        statusItem.button?.image = NSImage(systemSymbolName: "square.grid.2x2", accessibilityDescription: "__APP_NAME__")
        statusItem.button?.image?.isTemplate = true
        statusItem.menu = menu
        loadProjects()
        rebuildMenu()
    }

    private func loadProjects() {
        let candidates = [
            URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("launcher-projects.json"),
            Bundle.main.resourceURL?.appendingPathComponent("launcher-projects.json")
        ].compactMap { $0 }
        guard let url = candidates.first(where: { FileManager.default.fileExists(atPath: $0.path) }),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode([Project].self, from: data) else {
            projects = []
            return
        }
        projects = decoded
    }

    private func rebuildMenu() {
        menu.removeAllItems()
        let title = NSMenuItem(title: "__APP_NAME__", action: nil, keyEquivalent: "")
        title.isEnabled = false
        menu.addItem(title)
        menu.addItem(.separator())

        for project in projects.sorted(by: compareProjects) {
            let item = NSMenuItem(title: project.shortName ?? project.name, action: #selector(openProject(_:)), keyEquivalent: "")
            item.target = self
            item.representedObject = project.name
            menu.addItem(item)
        }

        menu.addItem(.separator())
        let diagnostics = NSMenuItem(title: "Copy Diagnostics", action: #selector(copyDiagnostics), keyEquivalent: "")
        diagnostics.target = self
        menu.addItem(diagnostics)
        let quit = NSMenuItem(title: "Quit", action: #selector(quit), keyEquivalent: "q")
        quit.target = self
        menu.addItem(quit)
    }

    private func compareProjects(_ left: Project, _ right: Project) -> Bool {
        let leftOrder = left.displayOrder ?? 10_000
        let rightOrder = right.displayOrder ?? 10_000
        if leftOrder != rightOrder { return leftOrder < rightOrder }
        return left.name.localizedCaseInsensitiveCompare(right.name) == .orderedAscending
    }

    @objc private func openProject(_ sender: NSMenuItem) {
        guard let name = sender.representedObject as? String,
              let project = projects.first(where: { $0.name == name }) else { return }
        if let url = URL(string: project.hostedUrl ?? project.localUrl ?? ""), url.scheme != nil {
            NSWorkspace.shared.open(url)
            return
        }
        if let commandPath = project.launcherCommandPath {
            NSWorkspace.shared.open(URL(fileURLWithPath: NSString(string: commandPath).expandingTildeInPath))
            return
        }
        if let command = project.startCommand ?? project.repairCommand {
            runDetached(command)
        }
    }

    @objc private func copyDiagnostics() {
        let report = projects.map { project in
            "\(project.name) | service=\(project.serviceType ?? "-") | local=\(project.localUrl ?? "-") | hosted=\(project.hostedUrl ?? "-") | health=\(project.healthUrl ?? "-")"
        }.joined(separator: "\n")
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(report, forType: .string)
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }

    private func runDetached(_ command: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/bin/zsh")
        process.arguments = ["-lc", command]
        process.standardOutput = FileHandle(forWritingAtPath: "/dev/null")
        process.standardError = FileHandle(forWritingAtPath: "/dev/null")
        try? process.run()
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
