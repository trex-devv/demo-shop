import React from 'react';

const FormattedDescription = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];
  let listType = 'ul';
  let inBlockquote = false;
  let blockquoteLines = [];

  const renderList = () => {
    if (listItems.length === 0) return null;
    const items = listItems;
    listItems = [];
    inList = false;
    const listTypeCopy = listType;
    listType = 'ul';

    if (listTypeCopy === 'task') {
      return (
        <ul key={`task-${Date.now()}-${Math.random()}`} className="space-y-1 my-2 font-poppins">
          {items.map((item, idx) => {
            const isChecked = item.startsWith('[x]') || item.startsWith('[X]');
            const content = item.replace(/^\[[xX]\]\s*/, '').replace(/^\[\s\]\s*/, '');
            return (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                <span className="text-gray-400 flex-shrink-0 mt-0.5">
                  {isChecked ? '☑' : '☐'}
                </span>
                <span dangerouslySetInnerHTML={{ __html: processInlineMarkdown(content) }} />
              </li>
            );
          })}
        </ul>
      );
    }

    const ListTag = listTypeCopy === 'ul' ? 'ul' : 'ol';
    const className = listTypeCopy === 'ul' 
      ? 'space-y-1 my-2 list-disc pl-5 font-poppins' 
      : 'space-y-1 my-2 list-decimal pl-5 font-poppins';
    
    return (
      <ListTag key={`list-${Date.now()}-${Math.random()}`} className={className}>
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-gray-600 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
          </li>
        ))}
      </ListTag>
    );
  };

  const processInlineMarkdown = (text) => {
    let processed = text;
    // Bold: **text** or __text__
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    processed = processed.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    processed = processed.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em>$1</em>');
    // Strikethrough: ~~text~~
    processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // Inline code: `code`
    processed = processed.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    // Links: [text](url)
    processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
    return processed;
  };

  const renderBlockquote = () => {
    if (blockquoteLines.length === 0) return null;
    const content = blockquoteLines.join(' ');
    blockquoteLines = [];
    inBlockquote = false;
    return (
      <blockquote key={`blockquote-${Date.now()}-${Math.random()}`} className="border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600 italic font-poppins">
        <span dangerouslySetInnerHTML={{ __html: processInlineMarkdown(content) }} />
      </blockquote>
    );
  };

  const isHorizontalRule = (line) => /^---$|^___$|^\*\*\*$/.test(line.trim());
  const isHeading = (line) => /^#{1,6}\s/.test(line.trim());
  const getHeadingLevel = (line) => {
    const match = line.match(/^(#{1,6})\s/);
    return match ? match[1].length : 0;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Horizontal rule
    if (isHorizontalRule(line)) {
      if (inList) { const list = renderList(); if (list) elements.push(list); }
      if (inBlockquote) { const bq = renderBlockquote(); if (bq) elements.push(bq); }
      elements.push(<hr key={index} className="my-6 border-t border-gray-200" />);
      return;
    }

    // Blockquotes
    if (trimmed.startsWith('> ')) {
      if (inList) { const list = renderList(); if (list) elements.push(list); }
      if (!inBlockquote) {
        if (blockquoteLines.length > 0) { const bq = renderBlockquote(); if (bq) elements.push(bq); }
        inBlockquote = true;
        blockquoteLines = [trimmed.substring(2)];
      } else {
        blockquoteLines.push(trimmed.substring(2));
      }
      return;
    }

    if (inBlockquote && !trimmed.startsWith('> ')) {
      const bq = renderBlockquote();
      if (bq) elements.push(bq);
    }

    // Empty lines
    if (!trimmed) {
      if (inList) { const list = renderList(); if (list) elements.push(list); }
      if (inBlockquote) { const bq = renderBlockquote(); if (bq) elements.push(bq); }
      return;
    }

    // Headings
    if (isHeading(trimmed)) {
      if (inList) { const list = renderList(); if (list) elements.push(list); }
      const level = getHeadingLevel(trimmed);
      const content = trimmed.substring(level + 1);
      const headingClasses = {
        1: 'text-2xl font-bold mt-6 mb-3 font-poppins',
        2: 'text-xl font-semibold mt-5 mb-2.5 font-poppins',
        3: 'text-lg font-semibold mt-4 mb-2 font-poppins',
        4: 'text-base font-semibold mt-3 mb-1.5 font-poppins',
        5: 'text-sm font-semibold mt-2 mb-1 font-poppins',
        6: 'text-sm font-medium text-gray-600 mt-2 mb-1 font-poppins'
      };
      const Tag = `h${level}`;
      elements.push(
        <Tag key={index} className={headingClasses[level] || headingClasses[3]}>
          <span dangerouslySetInnerHTML={{ __html: processInlineMarkdown(content) }} />
        </Tag>
      );
      return;
    }

    // Task lists
    const taskMatch = trimmed.match(/^-\s+\[([xX\s])\]\s+(.*)/);
    if (taskMatch) {
      const status = taskMatch[1];
      const content = taskMatch[2];
      if (inList && listType !== 'task') { const list = renderList(); if (list) elements.push(list); }
      if (!inList) {
        listType = 'task';
        inList = true;
        listItems = [`[${status}] ${content}`];
      } else {
        listItems.push(`[${status}] ${content}`);
      }
      return;
    }

    // Ordered lists
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      const content = orderedMatch[2];
      if (inList && listType !== 'ol') { const list = renderList(); if (list) elements.push(list); }
      if (!inList) {
        listType = 'ol';
        inList = true;
        listItems = [content];
      } else {
        listItems.push(content);
      }
      return;
    }

    // Unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
      const content = trimmed.replace(/^[-*+]\s*/, '');
      if (inList && listType !== 'ul') { const list = renderList(); if (list) elements.push(list); }
      if (!inList) {
        listType = 'ul';
        inList = true;
        listItems = [content];
      } else {
        listItems.push(content);
      }
      return;
    }

    // If we were in a list and this isn't a list item, render the list
    if (inList) { const list = renderList(); if (list) elements.push(list); }

    // Regular paragraph
    const processedContent = processInlineMarkdown(trimmed);
    elements.push(
      <p 
        key={index} 
        className="text-sm text-gray-600 leading-relaxed mb-1.5 font-poppins"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  });

  // Render any remaining blockquote
  if (inBlockquote) { const bq = renderBlockquote(); if (bq) elements.push(bq); }
  // Render any remaining list
  if (inList) { const list = renderList(); if (list) elements.push(list); }

  return <div className="space-y-0.5">{elements}</div>;
};

export default FormattedDescription;