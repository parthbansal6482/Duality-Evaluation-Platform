import { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoCodeEditorProps {
    language: string;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    typingDelay?: number;
    onRun?: () => void;
    onSubmit?: () => void;
    disablePaste?: boolean;
}

export function MonacoCodeEditor({
    language,
    value,
    onChange,
    readOnly = false,
    typingDelay = 0,
    onRun,
    onSubmit,
    disablePaste = false,
}: MonacoCodeEditorProps) {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isThrottledRef = useRef(false);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            onRun?.();
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
            onSubmit?.();
        });
        
        if (disablePaste) {
            const domNode = editor.getDomNode();
            if (domNode) {
                // Intercept standard clipboard events
                domNode.addEventListener('paste', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, true);
            }
            
            // Intercept keyboard shortcuts just in case
            editor.onKeyDown((e) => {
                if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }

        // Focus editor
        editor.focus();
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value === undefined) return;

        // Apply typing delay if sabotage is active
        if (typingDelay > 0 && !isThrottledRef.current) {
            isThrottledRef.current = true;

            // Set editor to read-only temporary
            if (editorRef.current) {
                editorRef.current.updateOptions({ readOnly: true });
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                isThrottledRef.current = false;
                if (editorRef.current) {
                    editorRef.current.updateOptions({ readOnly: readOnly });
                }
                onChange(value);
            }, typingDelay);
        } else if (typingDelay === 0) {
            onChange(value);
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Map language names to Monaco language IDs
    const getMonacoLanguage = (lang: string): string => {
        const languageMap: Record<string, string> = {
            python: 'python',
            c: 'c',
            cpp: 'cpp',
            java: 'java',
        };
        return languageMap[lang] || 'plaintext';
    };

    return (
        <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                tabSize: 4,
                insertSpaces: true,
                automaticLayout: true,
                readOnly: readOnly,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                quickSuggestions: true,
                wordWrap: 'on',
                bracketPairColorization: {
                    enabled: true,
                },
                padding: {
                    top: 16,
                    bottom: 16,
                },
            }}
        />
    );
}
