// Clean, modern Markdown & structured text renderer for chat output.
// Strictly prevents raw "**" or "****" artifacts from appearing on screen,
// even while tokens are actively streaming.
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FONTS, type Theme } from '../theme';

const MONO = Platform.select({ android: 'monospace', default: 'monospace' });

interface Props {
  text: string;
  color: string;
  theme: Theme;
}

/** Clean up stray or empty asterisk clusters like **** or trailing unclosed ** while streaming. */
function sanitizeLine(raw: string): string {
  // Remove empty bold markers like **** or ***
  let cleaned = raw.replace(/\*{3,}/g, '');
  // If there is an odd number of ** pairs (e.g. streaming mid-word), strip dangling **
  const doubleCount = (cleaned.match(/\*\*/g) || []).length;
  if (doubleCount % 2 !== 0) {
    const lastIdx = cleaned.lastIndexOf('**');
    if (lastIdx !== -1) {
      cleaned = cleaned.slice(0, lastIdx) + cleaned.slice(lastIdx + 2);
    }
  }
  return cleaned;
}

/** `inline code`, **bold**, __bold__, *italic*, _italic_ runs inside one line. */
function renderInline(rawLine: string, key: string, color: string, theme: Theme) {
  const line = sanitizeLine(rawLine);
  const re = /(`[^`]+`)|(\*\*[\s\S]+?\*\*)|(__[\s\S]+?__)|(\*[^*\n]+\*)|(_[^_\n]+_)/g;
  const runs: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) {
      runs.push(line.slice(last, m.index).replace(/\*\*/g, ''));
    }
    const token = m[0];
    const k = `${key}-${i++}`;
    if (token.startsWith('`')) {
      runs.push(
        <Text
          key={k}
          style={{
            fontFamily: MONO,
            backgroundColor: theme.cardSecondary,
            color: theme.accentHighlight,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: 5,
            fontSize: 13.5,
          }}
        >
          {token.slice(1, -1)}
        </Text>
      );
    } else if (token.startsWith('**') || token.startsWith('__')) {
      const inner = token.slice(2, -2).replace(/\*/g, '');
      runs.push(
        <Text key={k} style={{ fontFamily: FONTS.semiBold, fontWeight: '700', color }}>
          {inner}
        </Text>
      );
    } else {
      const inner = token.slice(1, -1).replace(/\*/g, '');
      runs.push(
        <Text key={k} style={{ fontStyle: 'italic' }}>
          {inner}
        </Text>
      );
    }
    last = m.index + token.length;
  }
  if (last < line.length) {
    runs.push(line.slice(last).replace(/\*\*/g, ''));
  }
  return runs;
}

/** One non-code block: headings, lists, and paragraphs separated by blanks. */
function renderTextBlock(text: string, base: string, color: string, theme: Theme) {
  const nodes: React.ReactNode[] = [];
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    const key = `${base}-p${nodes.length}`;
    nodes.push(
      <Text key={key} style={[styles.text, { color }]}>
        {para.map((l, i) => (
          <React.Fragment key={i}>
            {i > 0 && '\n'}
            {renderInline(l, `${key}-${i}`, color, theme)}
          </React.Fragment>
        ))}
      </Text>
    );
    para = [];
  };

  for (const line of text.split('\n')) {
    const heading = line.match(/^(#{1,6})\s+(.*)/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)/);
    const key = `${base}-l${nodes.length}-${para.length}`;
    if (heading) {
      flush();
      const level = heading[1].length;
      const size = level === 1 ? 17.5 : level === 2 ? 16.5 : 15.5;
      nodes.push(
        <Text key={key} style={[styles.heading, { color, fontSize: size }]}>
          {renderInline(heading[2], key, color, theme)}
        </Text>
      );
    } else if (bullet) {
      flush();
      nodes.push(
        <View key={key} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: theme.tint }]} />
          <Text style={[styles.text, styles.listText, { color }]}>
            {renderInline(bullet[1], key, color, theme)}
          </Text>
        </View>
      );
    } else if (numbered) {
      flush();
      nodes.push(
        <View key={key} style={styles.bulletRow}>
          <Text style={[styles.numberBadge, { color: theme.tint }]}>{numbered[1]}.</Text>
          <Text style={[styles.text, styles.listText, { color }]}>
            {renderInline(numbered[2], key, color, theme)}
          </Text>
        </View>
      );
    } else if (line.trim() === '') {
      flush();
    } else {
      para.push(line);
    }
  }
  flush();
  return nodes;
}

export const MarkdownText = React.memo(function MarkdownText({ text, color, theme }: Props) {
  const chunks = text.split('```');
  const nodes: React.ReactNode[] = [];
  chunks.forEach((chunk, i) => {
    const isCode = i % 2 === 1;
    if (isCode) {
      const nl = chunk.indexOf('\n');
      const firstLine = nl === -1 ? chunk : chunk.slice(0, nl);
      const body =
        nl === -1 ? (firstLine.includes(' ') ? chunk : '') : chunk.slice(nl + 1);
      nodes.push(
        <View
          key={`c${i}`}
          style={[
            styles.code,
            { backgroundColor: theme.cardSecondary, borderColor: theme.border, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.codeText, { color }]}>{body}</Text>
        </View>
      );
    } else if (chunk.trim()) {
      nodes.push(...renderTextBlock(chunk, `t${i}`, color, theme));
    }
  });
  return <View style={styles.container}>{nodes}</View>;
});

const styles = StyleSheet.create({
  container: { gap: 8 },
  text: { fontSize: 15, lineHeight: 22 },
  heading: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    lineHeight: 23,
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 2,
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  numberBadge: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 22,
    minWidth: 18,
  },
  listText: {
    flex: 1,
  },
  code: { borderRadius: 10, padding: 10 },
  codeText: { fontFamily: MONO, fontSize: 13 },
});

