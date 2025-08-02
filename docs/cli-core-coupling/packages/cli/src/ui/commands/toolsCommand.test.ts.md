**File:** `packages/cli/src/ui/commands/toolsCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Tool`

**Usage Patterns:**
1.  **Mocking `Tool`:**
    *   `mockTools`: An array of mock `Tool` objects is defined to simulate available tools.

2.  **Testing Tool Listing Functionality:**
    *   `mockContext.services.config.getToolRegistry()`: Used to retrieve the mocked tool registry.
    *   Tests verify that the command displays an error if the tool registry is unavailable.
    *   It asserts that "No tools available" is displayed when no tools are found.
    *   It checks that tools are listed without descriptions by default and with descriptions when the "desc" argument is passed.
