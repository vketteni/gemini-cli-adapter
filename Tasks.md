  Project Overview:
  The "Gemini CLI Adapter" project aims to decouple the Gemini CLI frontend from
  its original @google/gemini-cli-core module. This is achieved through a
  CoreAdapter interface, allowing for seamless integration of alternative AI
  backends (e.g., OpenAI, Anthropic) while maintaining backward compatibility.
  We've largely completed the architectural decoupling (Phase 3E).

  Our Immediate Goal:
  To create a fully functional, custom CLI version located at apps/gemini-cli
  that leverages this new CoreAdapter architecture and mirrors the original CLI's
   startup and execution flow.

  Current Status & Next Steps:
  We've made significant progress in setting up a robust TypeScript monorepo
  build system using project references. We've standardized tsconfig.json files,
  enabled composite: true across packages, and configured typeRoots. We've also
  resolved a critical Config type duplication issue by adjusting imports within
  the gemini-cli-core-shim. For now, we've temporarily stubbed the sandbox
  configuration via the adapter to bypass immediate runtime issues.

  The current build is failing with:
   1. TS2307 errors (module not found) for google-auth-library and lowlight within
      packages/core_copy.
   2. TS2304 errors (DEFAULT_GEMINI_MODEL not found) in
      packages/gemini-cli-core-shim, despite attempts to import it.

  Immediate Tasks for the New Team Member:
   1. Install missing `@types` packages: Install @types/google-auth-library and
      @types/lowlight in the project root.
   2. Re-verify `DEFAULT_GEMINI_MODEL` import: Ensure DEFAULT_GEMINI_MODEL and
      DEFAULT_GEMINI_EMBEDDING_MODEL are correctly imported into
      packages/gemini-cli-core-shim/src/google-adapter.ts from
      packages/core_copy/src/config/models.js.
   3. Perform full project build: Run npm run build from the project root.
   4. Run `apps/gemini-cli`: Execute the custom CLI (npm start from apps/gemini-cli)
       to confirm it starts without runtime errors.


	   
   5. Address `Config` to `CoreAdapter` type mismatches in tests: Systematically
      update test files in packages/cli to use CoreAdapter mocks instead of direct
      Config objects.
   6. Re-enable test files in `tsconfig.base.json`: Remove the temporary exclusion
      of test files from the build once the main application is stable.
   7. Refactor `validateNonInteractiveAuth`: Remove the redundant validateAuthMethod
       import and directly use adapter.auth.validateAuthMethod.
   8. Properly implement `getSandboxConfig`: Replace the null stub in
      GoogleSettingsService with the actual sandbox configuration logic.