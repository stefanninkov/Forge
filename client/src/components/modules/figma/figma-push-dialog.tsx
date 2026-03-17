import { useState } from 'react';
import {
  X, Check, Upload, Layers, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FigmaAnalysis, ParsedNode } from '@/types/figma';
import type { Project } from '@/types/project';
import { PrePushReview } from './pre-push-review';

export interface FigmaPushDialogProps {
  analysis: FigmaAnalysis;
  project: Project;
  onClose: () => void;
}

export function FigmaPushDialog({
  analysis,
  project,
  onClose,
}: FigmaPushDialogProps) {
  const [targetPage, setTargetPage] = useState('new');
  const [newPageName, setNewPageName] = useState(analysis.pageName ?? 'Home');
  const [includeStyles, setIncludeStyles] = useState(true);
  const [includeText, setIncludeText] = useState(true);
  const [includeAnimations, setIncludeAnimations] = useState(false);
  const [showClassReview, setShowClassReview] = useState(false);
  const [showPrePushReview, setShowPrePushReview] = useState(false);
  const [copied, setCopied] = useState(false);

  const countNodes = (node: FigmaAnalysis['structure']): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };

  const elementCount = analysis ? countNodes(analysis.structure) : 0;

  const collectClasses = (node: FigmaAnalysis['structure']): Array<{ name: string; tag: string; figmaName: string }> => {
    const result: Array<{ name: string; tag: string; figmaName: string }> = [];
    result.push({ name: node.suggestedClass, tag: node.type, figmaName: node.name });
    for (const child of node.children) {
      result.push(...collectClasses(child));
    }
    return result;
  };

  const classes = collectClasses(analysis.structure);

  function nodeToHtml(node: FigmaAnalysis['structure'], indent = 0): string {
    const pad = '  '.repeat(indent);
    const styles = (node.properties._styles as Record<string, string>) ?? {};
    const text = node.properties.text as string | undefined;
    const styleStr = Object.entries(styles)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
      .join('; ');

    let tag = node.type === 'section' ? 'section' : node.type === 'text' ? 'p' : 'div';
    if (node.type === 'text') {
      const fontSize = node.properties.fontSize as number | undefined;
      if (fontSize && fontSize >= 32) tag = 'h1';
      else if (fontSize && fontSize >= 24) tag = 'h2';
      else if (fontSize && fontSize >= 20) tag = 'h3';
    }

    const attrs = `class="${node.suggestedClass}"${includeStyles && styleStr ? ` style="${styleStr}"` : ''}`;

    if (text && includeText) {
      return `${pad}<${tag} ${attrs}>${text}</${tag}>`;
    }

    if (node.children.length === 0) {
      return `${pad}<${tag} ${attrs}></${tag}>`;
    }

    const childHtml = node.children.map((c) => nodeToHtml(c, indent + 1)).join('\n');
    return `${pad}<${tag} ${attrs}>\n${childHtml}\n${pad}</${tag}>`;
  }

  async function handleCopyHtml() {
    const html = nodeToHtml(analysis.structure);
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function generateDesignerScript(node: FigmaAnalysis['structure'], varName = 'root', indent = 0): string {
    const pad = '  '.repeat(indent);
    const lines: string[] = [];
    let tag = node.type === 'section' ? 'section' : node.type === 'text' ? 'p' : 'div';
    if (node.type === 'text') {
      const fontSize = node.properties.fontSize as number | undefined;
      if (fontSize && fontSize >= 32) tag = 'h1';
      else if (fontSize && fontSize >= 24) tag = 'h2';
      else if (fontSize && fontSize >= 20) tag = 'h3';
    }

    lines.push(`${pad}const ${varName} = webflow.elementBuilder('${tag === 'section' ? 'Section' : tag === 'div' ? 'DivBlock' : 'TextBlock'}');`);
    lines.push(`${pad}${varName}.setTag('${tag}');`);
    lines.push(`${pad}${varName}.setAttribute('class', '${node.suggestedClass}');`);

    if (includeStyles) {
      const styles = (node.properties._styles as Record<string, string>) ?? {};
      for (const [k, v] of Object.entries(styles)) {
        lines.push(`${pad}${varName}.setStyles({ '${k.replace(/([A-Z])/g, '-$1').toLowerCase()}': '${v}' });`);
      }
    }

    if (includeText && node.properties.text) {
      lines.push(`${pad}${varName}.setTextContent('${String(node.properties.text).replace(/'/g, "\\'")}');`);
    }

    node.children.forEach((child, i) => {
      const childVar = `${varName}_c${i}`;
      lines.push('');
      lines.push(...generateDesignerScript(child, childVar, indent).split('\n'));
      lines.push(`${pad}${varName}.append(${childVar});`);
    });

    return lines.join('\n');
  }

  async function handleCopyScript() {
    const script = generateDesignerScript(analysis.structure);
    await navigator.clipboard.writeText(script);
    toast.success('Designer API script copied to clipboard');
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: 520,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Push to Webflow
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              Review and configure before pushing
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Push Summary */}
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              Push Summary
            </label>
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <SummaryRow label="Forge Project" value={project.name} />
              <SummaryRow label="Elements" value={`${elementCount} elements`} />
              <SummaryRow label="Figma Page" value={analysis.pageName ?? 'Unknown'} />
              <SummaryRow
                label="Webflow Site"
                value={project.webflowSiteId ?? 'Not linked'}
                warning={!project.webflowSiteId}
              />
            </div>
          </div>

          {/* Target Page */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Target Webflow Page
            </label>
            <div className="flex" style={{ gap: 8 }}>
              <select
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                style={{
                  flex: 1,
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                <option value="new">Create new page</option>
              </select>
            </div>
            {targetPage === 'new' && (
              <input
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder="Page name"
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: 8,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Push Options */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
              Include
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ToggleOption
                checked={true}
                disabled
                label="Structure & Classes"
                description="Element hierarchy and Client-First class names"
              />
              <ToggleOption
                checked={includeStyles}
                onChange={setIncludeStyles}
                label="Styles from Figma"
                description="Colors, fonts, spacing extracted from the design"
              />
              <ToggleOption
                checked={includeText}
                onChange={setIncludeText}
                label="Text content"
                description="Headings, paragraphs, and button labels from Figma"
              />
              <ToggleOption
                checked={includeAnimations}
                onChange={setIncludeAnimations}
                label="Animation attributes"
                description="Data attributes for scroll and interaction animations"
              />
            </div>
          </div>

          {/* Class name review */}
          <div>
            <button
              onClick={() => setShowClassReview(!showClassReview)}
              className="flex items-center cursor-pointer"
              style={{
                gap: 6,
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                padding: 0,
                fontFamily: 'var(--font-sans)',
                marginBottom: showClassReview ? 8 : 0,
              }}
            >
              <ChevronDown
                size={14}
                style={{
                  transform: showClassReview ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms',
                }}
              />
              Review class names ({classes.length})
            </button>
            {showClassReview && (
              <div
                style={{
                  maxHeight: 160,
                  overflowY: 'auto',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {classes.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center"
                    style={{
                      padding: '4px 10px',
                      gap: 8,
                      borderBottom: i < classes.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--text-tertiary)', minWidth: 32 }}>{c.tag}</span>
                    <span style={{ color: 'var(--accent-text)' }}>.{c.name}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 9 }}>{c.figmaName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pre-Push Review */}
        {showPrePushReview && (
          <div style={{ borderTop: '1px solid var(--border-default)' }}>
            <PrePushReview
              nodes={(() => {
                const convert = (node: ParsedNode): { id: string; name: string; type: string; className?: string; htmlTag?: string; children?: Array<{ id: string; name: string; type: string; className?: string; htmlTag?: string; children?: unknown[] }> } => ({
                  id: node.id,
                  name: node.name,
                  type: node.figmaType,
                  className: node.suggestedClass,
                  htmlTag: node.type === 'section' ? 'section' : node.type === 'text' ? 'p' : 'div',
                  children: node.children.map(convert),
                });
                return [convert(analysis.structure)];
              })()}
              nodeStyleOverrides={{}}
              nodeAnimations={{}}
              onPush={() => {
                toast.success('Push initiated (MCP integration required)');
                onClose();
              }}
              onCancel={() => setShowPrePushReview(false)}
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)' }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {elementCount} elements · {classes.length} classes
          </span>
          <div className="flex" style={{ gap: 8 }}>
            {!showPrePushReview && (
              <button
                onClick={() => setShowPrePushReview(true)}
                className="border-none cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent)',
                  backgroundColor: 'transparent',
                  color: 'var(--accent-text)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Review
              </button>
            )}
            <button
              onClick={onClose}
              className="border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-hover)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCopyHtml}
              className="flex items-center border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 14px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {copied ? <Check size={14} /> : <Layers size={14} />}
              {copied ? 'Copied' : 'Copy HTML'}
            </button>
            <button
              onClick={handleCopyScript}
              className="flex items-center border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 14px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            >
              <Upload size={14} />
              Copy Designer Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-default)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ color: warning ? '#f59e0b' : 'var(--text-primary)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function ToggleOption({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <label
      className="flex items-center cursor-pointer"
      style={{
        gap: 10,
        padding: '6px 8px',
        borderRadius: 'var(--radius-md)',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {description}
        </div>
      </div>
    </label>
  );
}
