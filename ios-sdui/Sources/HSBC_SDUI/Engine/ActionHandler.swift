// ActionHandler.swift
// HSBC SDUI iOS Renderer
// Routes SDUI action definitions to native iOS behaviours.

import UIKit
import SwiftUI

// MARK: - ActionHandler

/// Handles all SDUI-defined actions and routes them to the appropriate
/// native iOS mechanism (navigation, deep-link, API call, modal, share, analytics).
public final class ActionHandler {

    // MARK: Notification names

    public static let navigationNotification = Notification.Name("HSBC.SDUI.Navigate")
    public static let modalNotification      = Notification.Name("HSBC.SDUI.Modal")

    // MARK: Init

    public init() {}

    // MARK: Public API

    /// Handles a single `ActionDefinition`.
    /// - Parameters:
    ///   - action: The action to execute.
    ///   - viewController: The presenting view controller (required for share sheet and modal).
    public func handle(action: ActionDefinition, from viewController: UIViewController? = nil) {
        switch action.type {

        case .NAVIGATE:
            handleNavigate(action: action)

        case .DEEP_LINK:
            handleDeepLink(action: action)

        case .API_CALL:
            handleAPICall(action: action)

        case .TRACK:
            handleTrack(action: action)

        case .SHARE:
            handleShare(action: action, from: viewController)

        case .MODAL:
            handleModal(action: action)
        }
    }

    // MARK: - Private handlers

    private func handleNavigate(action: ActionDefinition) {
        guard let destination = action.destination, !destination.isEmpty else {
            AnalyticsClient.fire(event: "sdui_action_error", properties: [
                "type": "NAVIGATE", "reason": "missing_destination"
            ])
            return
        }

        var userInfo: [String: Any] = ["destination": destination]
        if let params = action.params {
            userInfo["params"] = params.mapValues { $0.value as Any }
        }

        NotificationCenter.default.post(
            name: ActionHandler.navigationNotification,
            object: nil,
            userInfo: userInfo
        )

        AnalyticsClient.fire(event: "sdui_navigate", properties: ["destination": destination])
    }

    private func handleDeepLink(action: ActionDefinition) {
        guard
            let destination = action.destination,
            let url = URL(string: destination)
        else {
            AnalyticsClient.fire(event: "sdui_action_error", properties: [
                "type": "DEEP_LINK", "reason": "invalid_url"
            ])
            return
        }

        DispatchQueue.main.async {
            guard UIApplication.shared.canOpenURL(url) else {
                AnalyticsClient.fire(event: "sdui_action_error", properties: [
                    "type": "DEEP_LINK", "reason": "cannot_open_url", "url": destination
                ])
                return
            }
            UIApplication.shared.open(url, options: [:]) { success in
                AnalyticsClient.fire(event: "sdui_deep_link", properties: [
                    "url": destination, "success": success
                ])
            }
        }
    }

    private func handleAPICall(action: ActionDefinition) {
        guard
            let destination = action.destination,
            let url = URL(string: destination)
        else {
            AnalyticsClient.fire(event: "sdui_action_error", properties: [
                "type": "API_CALL", "reason": "invalid_url"
            ])
            return
        }

        var request = URLRequest(url: url, timeoutInterval: 15)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ios", forHTTPHeaderField: "x-platform")

        if let payload = action.payload {
            let encodable = payload.mapValues { $0.value }
            request.httpBody = try? JSONSerialization.data(withJSONObject: encodable)
        }

        URLSession.shared.dataTask(with: request) { _, response, error in
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            if let error = error {
                AnalyticsClient.fire(event: "sdui_api_call_error", properties: [
                    "url": destination, "error": error.localizedDescription
                ])
            } else {
                AnalyticsClient.fire(event: "sdui_api_call_success", properties: [
                    "url": destination, "status_code": statusCode
                ])
            }
        }.resume()
    }

    private func handleTrack(action: ActionDefinition) {
        let event = action.destination ?? "sdui_custom_event"
        var properties: [String: Any] = [:]
        if let params = action.params {
            for (key, value) in params {
                properties[key] = value.value as Any
            }
        }
        AnalyticsClient.fire(event: event, properties: properties)
    }

    private func handleShare(action: ActionDefinition, from viewController: UIViewController?) {
        var items: [Any] = []

        if let destination = action.destination {
            items.append(destination)
        }
        if let params = action.params,
           let text = params["text"]?.stringValue {
            items.append(text)
        }
        if let params = action.params,
           let urlString = params["url"]?.stringValue,
           let url = URL(string: urlString) {
            items.append(url)
        }

        guard !items.isEmpty else {
            AnalyticsClient.fire(event: "sdui_action_error", properties: [
                "type": "SHARE", "reason": "no_share_items"
            ])
            return
        }

        DispatchQueue.main.async {
            let activityVC = UIActivityViewController(
                activityItems: items,
                applicationActivities: nil
            )
            activityVC.completionWithItemsHandler = { activityType, completed, _, _ in
                AnalyticsClient.fire(event: "sdui_share", properties: [
                    "activity_type": activityType?.rawValue ?? "unknown",
                    "completed": completed
                ])
            }

            let presenter = viewController
                ?? UIApplication.shared.connectedScenes
                    .compactMap { $0 as? UIWindowScene }
                    .first?.windows.first?.rootViewController

            presenter?.present(activityVC, animated: true)
        }
    }

    private func handleModal(action: ActionDefinition) {
        var userInfo: [String: Any] = [:]
        if let destination = action.destination {
            userInfo["modal_id"] = destination
        }
        if let params = action.params {
            userInfo["params"] = params.mapValues { $0.value as Any }
        }

        NotificationCenter.default.post(
            name: ActionHandler.modalNotification,
            object: nil,
            userInfo: userInfo
        )

        AnalyticsClient.fire(event: "sdui_modal_open", properties: [
            "modal_id": action.destination ?? "unknown"
        ])
    }
}
