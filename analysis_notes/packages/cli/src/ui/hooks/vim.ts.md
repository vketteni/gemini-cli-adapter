# Analysis of `packages/cli/src/ui/hooks/vim.ts`

This file implements the `useVim` React hook, providing Vim-style editing capabilities within the CLI.

## Core Module Interactions

The primary interaction with the core module occurs through the `TextBuffer` object, which is passed as a parameter to the `useVim` hook. The `TextBuffer` acts as an abstraction layer for text manipulation and cursor management within the CLI's input area.

The following methods of the `TextBuffer` are called by `useVim`:

*   `buffer.vimDeleteWordForward(count)`: Deletes words forward.
*   `buffer.vimDeleteWordBackward(count)`: Deletes words backward.
*   `buffer.vimDeleteWordEnd(count)`: Deletes to the end of a word.
*   `buffer.vimChangeWordForward(count)`: Changes words forward (deletes and enters INSERT mode).
*   `buffer.vimChangeWordBackward(count)`: Changes words backward (deletes and enters INSERT mode).
*   `buffer.vimChangeWordEnd(count)`: Changes to the end of a word (deletes and enters INSERT mode).
*   `buffer.vimDeleteChar(count)`: Deletes characters.
*   `buffer.vimDeleteLine(count)`: Deletes lines.
*   `buffer.vimChangeLine(count)`: Changes lines (deletes and enters INSERT mode).
*   `buffer.vimDeleteToEndOfLine()`: Deletes from cursor to end of line.
*   `buffer.vimChangeToEndOfLine()`: Changes from cursor to end of line (deletes and enters INSERT mode).
*   `buffer.vimChangeMovement(movementType, count)`: Handles change commands with movement (e.g., `ch`, `cj`).
*   `buffer.vimEscapeInsertMode()`: Handles cursor movement when exiting INSERT mode.
*   `buffer.text`: Reads the current text content of the buffer.
*   `buffer.setText('')`: Clears the text content of the buffer.
*   `buffer.handleInput(normalizedKey)`: Passes normalized key inputs for general text handling.
*   `buffer.vimMoveLeft(repeatCount)`: Moves the cursor left.
*   `buffer.vimMoveDown(repeatCount)`: Moves the cursor down.
*   `buffer.vimMoveUp(repeatCount)`: Moves the cursor up.
*   `buffer.vimMoveRight(repeatCount)`: Moves the cursor right.
*   `buffer.vimMoveWordForward(repeatCount)`: Moves cursor forward by words.
*   `buffer.vimMoveWordBackward(repeatCount)`: Moves cursor backward by words.
*   `buffer.vimMoveWordEnd(repeatCount)`: Moves cursor to the end of words.
*   `buffer.vimInsertAtCursor()`: Enters INSERT mode at the current cursor position.
*   `buffer.vimAppendAtCursor()`: Enters INSERT mode after the current cursor position.
*   `buffer.vimOpenLineBelow()`: Opens a new line below and enters INSERT mode.
*   `buffer.vimOpenLineAbove()`: Opens a new line above and enters INSERT mode.
*   `buffer.vimMoveToLineStart()`: Moves cursor to the start of the current line.
*   `buffer.vimMoveToLineEnd()`: Moves cursor to the end of the current line.
*   `buffer.vimMoveToFirstNonWhitespace()`: Moves cursor to the first non-whitespace character on the line.
*   `buffer.vimMoveToFirstLine()`: Moves cursor to the first line of the buffer.
*   `buffer.vimMoveToLine(state.count)`: Moves cursor to a specific line number.
*   `buffer.vimMoveToLastLine()`: Moves cursor to the last line of the buffer.
*   `buffer.vimInsertAtLineStart()`: Enters INSERT mode at the start of the line (first non-whitespace).
*   `buffer.vimAppendAtLineEnd()`: Enters INSERT mode at the end of the line.

The `useVimMode` context, imported from `../contexts/VimModeContext.js`, is also used to determine if Vim mode is enabled and to set the Vim mode. This context likely manages a global state related to Vim mode, which could be considered part of the CLI's UI state management rather than direct core module interaction.
