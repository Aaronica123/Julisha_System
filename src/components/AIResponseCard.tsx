import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  FileText,
  Target,
  Zap,
  Clock,
  Copy,
  Check,
  Building2,
  ListOrdered,
  Layers,
  BarChart3,
  Lightbulb,
} from 'lucide-react';

interface AIResponseCardProps {
  content: string;
  variant?: 'doctor' | 'admin' | 'intervention';
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = ({
  content,
  variant = 'doctor',
  title,
  subtitle,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) return null;

  // Theme styling based on variant
  const getThemeStyles = () => {
    switch (variant) {
      case 'doctor':
        return {
          cardBg: 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40',
          borderColor: 'border-teal-500/30',
          headerBg: 'bg-teal-500/10 border-teal-500/20',
          accentText: 'text-teal-400',
          badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          bulletColor: 'bg-teal-400',
          stepBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          icon: <Sparkles className="w-5 h-5 text-teal-400" />,
          defaultTitle: 'AI Clinical Mentorship Guidance',
        };
      case 'admin':
        return {
          cardBg: 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40',
          borderColor: 'border-cyan-500/30',
          headerBg: 'bg-cyan-500/10 border-cyan-500/20',
          accentText: 'text-cyan-400',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          bulletColor: 'bg-cyan-400',
          stepBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: <FileText className="w-5 h-5 text-cyan-400" />,
          defaultTitle: 'AI District Executive Summary',
        };
      case 'intervention':
        return {
          cardBg: 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40',
          borderColor: 'border-emerald-500/30',
          headerBg: 'bg-emerald-500/10 border-emerald-500/20',
          accentText: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          bulletColor: 'bg-emerald-400',
          stepBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <Target className="w-5 h-5 text-emerald-400" />,
          defaultTitle: 'AI Hospital Action & Intervention Plan',
        };
      default:
        return {
          cardBg: 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950',
          borderColor: 'border-slate-800',
          headerBg: 'bg-slate-800/40 border-slate-700/50',
          accentText: 'text-emerald-400',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          bulletColor: 'bg-emerald-400',
          stepBg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
          defaultTitle: 'AI Analysis',
        };
    }
  };

  const theme = getThemeStyles();

  // Helper to render bold text inside strings
  const renderInlineFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return (
          <strong
            key={index}
            className="font-semibold text-slate-100 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50"
          >
            {innerText}
          </strong>
        );
      }
      return part;
    });
  };

  // Helper to parse markdown table strings
  const parseMarkdownTable = (tableLines: string[]) => {
    if (tableLines.length < 2) return null;

    const parseRow = (rowStr: string) =>
      rowStr
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

    const headerCells = parseRow(tableLines[0]);
    // Line 1 is usually divider line: |---|---|
    const bodyLines = tableLines.slice(2);
    const rows = bodyLines.map((line) => parseRow(line));

    return (
      <div className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-inner">
        <table className="w-full text-xs text-left text-slate-200">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              {headerCells.map((header, idx) => (
                <th key={idx} className="p-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3 font-medium text-slate-200">
                    {renderInlineFormattedText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Structured parser for full markdown text
  const parseMarkdownContent = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];

    let currentTableLines: string[] = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Table line detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        currentTableLines.push(trimmed);
        continue;
      } else if (inTable) {
        // Table ended
        inTable = false;
        const renderedTable = parseMarkdownTable(currentTableLines);
        if (renderedTable) {
          elements.push(<React.Fragment key={`table-${i}`}>{renderedTable}</React.Fragment>);
        }
        currentTableLines = [];
      }

      if (!trimmed) {
        continue;
      }

      // Headers (##, ###, ####)
      if (trimmed.startsWith('#')) {
        const level = (trimmed.match(/^#+/) || ['#'])[0].length;
        const headerText = trimmed.replace(/^#+\s*/, '');

        // Match icon or emoji in header
        let HeaderIcon = <Sparkles className={`w-4 h-4 ${theme.accentText}`} />;
        if (headerText.includes('Critical') || headerText.includes('🔴') || headerText.includes('🚨') || headerText.includes('⚠️')) {
          HeaderIcon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
        } else if (headerText.includes('Summary') || headerText.includes('Executive') || headerText.includes('📊')) {
          HeaderIcon = <FileText className={`w-4 h-4 ${theme.accentText}`} />;
        } else if (headerText.includes('Interventions') || headerText.includes('Actions') || headerText.includes('📋') || headerText.includes('🎯')) {
          HeaderIcon = <Target className="w-4 h-4 text-emerald-400" />;
        } else if (headerText.includes('Strengths') || headerText.includes('Wins') || headerText.includes('🟢')) {
          HeaderIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
        } else if (headerText.includes('Redistribution') || headerText.includes('🔄')) {
          HeaderIcon = <Layers className="w-4 h-4 text-teal-400" />;
        }

        if (level === 2) {
          elements.push(
            <div key={`h2-${i}`} className="mt-5 mb-3 pt-3 border-t border-slate-800/80 first:mt-0 first:pt-0 first:border-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <span className="p-1 rounded-lg bg-slate-800/80 border border-slate-700/60">{HeaderIcon}</span>
                <span>{renderInlineFormattedText(headerText)}</span>
              </h3>
            </div>
          );
        } else if (level === 3) {
          elements.push(
            <div key={`h3-${i}`} className="mt-4 mb-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>{renderInlineFormattedText(headerText)}</span>
              </h4>
            </div>
          );
        } else {
          elements.push(
            <div key={`h4-${i}`} className="mt-3 mb-1">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {renderInlineFormattedText(headerText)}
              </h5>
            </div>
          );
        }
        continue;
      }

      // Bullet List (- or * or •)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const bulletText = trimmed.replace(/^[-*•]\s*/, '');
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start space-x-2.5 my-1.5 pl-1 text-xs text-slate-300 leading-relaxed">
            <span className={`w-1.5 h-1.5 rounded-full ${theme.bulletColor} mt-1.5 shrink-0 shadow-sm`} />
            <div className="flex-1">{renderInlineFormattedText(bulletText)}</div>
          </div>
        );
        continue;
      }

      // Numbered List (1. 2. 3.)
      const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const numText = numMatch[2];
        elements.push(
          <div key={`num-${i}`} className="flex items-start space-x-3 my-2 pl-0.5 text-xs text-slate-300 leading-relaxed">
            <span className={`w-5 h-5 rounded-full ${theme.stepBg} flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm`}>
              {num}
            </span>
            <div className="flex-1 pt-0.5">{renderInlineFormattedText(numText)}</div>
          </div>
        );
        continue;
      }

      // Regular Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed my-2">
          {renderInlineFormattedText(trimmed)}
        </p>
      );
    }

    // Flush any remaining table
    if (inTable && currentTableLines.length > 0) {
      const renderedTable = parseMarkdownTable(currentTableLines);
      if (renderedTable) {
        elements.push(<React.Fragment key="table-final">{renderedTable}</React.Fragment>);
      }
    }

    return elements;
  };

  return (
    <div className={`rounded-2xl border ${theme.borderColor} ${theme.cardBg} p-5 sm:p-6 shadow-xl relative backdrop-blur-sm ${className}`}>
      {/* Card Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${theme.headerBg} shadow-inner`}>{theme.icon}</div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>{title || theme.defaultTitle}</span>
            </h4>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${theme.badgeBg}`}>
            Gemini Engine Formatted
          </span>
          <button
            onClick={handleCopy}
            title="Copy Report"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700/60"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Formatted Content Area */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1 text-slate-200 custom-scrollbar font-sans">
        {parseMarkdownContent(content)}
      </div>
    </div>
  );
};
