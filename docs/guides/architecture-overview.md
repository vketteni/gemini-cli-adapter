# Architecture Overview

This document provides a high-level overview of the `gemini-cli-adapter` project architecture. Its purpose is to quickly onboard a new developer (human or AI) to the project's structure and the philosophy behind each module. Understanding this will lead to more idiomatic and effective contributions.

## Core Philosophy

The project's primary goal is to provide a reusable, high-quality command-line frontend (`@gemini-cli-adapter/cli-frontend`) for developers who have their own AI "core" logic. We achieve this by decoupling the UI from the AI backend via a clean, abstract interface (`@gemini-cli-adapter/core-interface`).

## Package Breakdown

### 1. `packages/core-interface`

*   **Philosophy: The Contract.**
*   **Purpose:** This is the architectural cornerstone of the project. It is a pure, abstract **contract** that defines how the frontend and any backend must communicate.
*   **Key Characteristics:**
    *   It contains only TypeScript interfaces and type definitions.
    *   It has zero dependencies on any other project package.
    *   It knows nothing about specific AI providers (like Google) or UI implementations.
*   **Guidance:** When making changes that affect the fundamental communication between the frontend and backend, this is the place to start. All abstract types and interfaces belong here.

### 2. `packages/cli-frontend`

*   **Philosophy: The Reusable Product.**
*   **Purpose:** This is the primary "product" we offer to developers. It is the Gemini CLI's beautiful and feature-rich user interface, which we have refactored into a reusable, backend-agnostic package.
*   **Key Characteristics:**
    *   It handles all complex UI work: rendering, user input, command parsing, etc.
    *   Its only architectural dependency is on `packages/core-interface`. It MUST NOT depend on any specific adapter (like `google-adapter`).
*   **Guidance:** All UI-related work, command definitions, and user-facing features belong here. When implementing new commands, ensure the logic only interacts with the abstract `CoreAdapter` interface, not a concrete implementation.

### 3. `packages/google-adapter`

*   **Philosophy: The Reference Implementation.**
*   **Purpose:** This package serves as the essential **proof-of-concept** and **example** for developers.
*   **Key Characteristics:**
    *   It is a minimal, faithful translation layer. It implements the `CoreAdapter` interface from `core-interface`.
    *   Its primary job is to translate generic requests from the interface into specific API calls for the Google Gemini SDK.
    *   It contains zero UI logic.
*   **Guidance:** This package is the blueprint for creating new adapters. When fixing bugs related to Google Gemini integration, this is the package to investigate.

### Application (`apps/gemini-cli`)

*   **Philosophy: The Live Demo.**
*   **Purpose:** This package builds the `demo-cli` executable. It is a lightweight container that assembles the `cli-frontend`, the `core-interface`, and the `google-adapter` into a single, runnable application.
*   **Guidance for AI:** Its primary purpose is to demonstrate that the entire system works together. It should remain minimal. Its `package.json` is the place where the concrete frontend and adapter are wired together.
