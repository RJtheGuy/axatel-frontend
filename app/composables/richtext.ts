/**
 * composables/richtext.ts
 *
 * Wagtail's Draftail editor always wraps saved content in an outer
 * <p data-block-key="...">, even for single-line fields like a button
 * label or a heading — every field converted to RichTextBlock in
 * core/blocks.py / blocks_sections.py / blocks_additions.py gets this,
 * there's no way around it from the Django side.
 *
 * That's fine when the field lands inside a template's own <div> or
 * <blockquote> (those legally allow a <p> child - just v-html it
 * directly, no helper needed). It's NOT fine inside a heading
 * (<h1>-<h6>), a link (<a>), or another inline element (<cite>,
 * <span>) - those only allow phrasing content, and a nested block
 * element there is invalid HTML. Browsers can silently auto-close the
 * outer tag when they hit it, which for a button label means the link
 * itself breaks.
 *
 * unwrapParagraph() strips exactly one layer of outer <p>...</p>,
 * keeping inner inline formatting (bold/italic/highlight/links)
 * intact, and use it for any RichText-sourced value going inside a
 * heading, link, or other inline element. If the field ever contains
 * more than one paragraph, the regex won't match and the original
 * string is returned unchanged - which will render oddly in a heading,
 * but that's a content problem (someone pressed Enter in a field meant
 * to be one line), not something to silently mask here.
 */
export function unwrapParagraph(html?: string | null): string {
    if (!html) return "";
    const match = html.trim().match(/^<p[^>]*>([\s\S]*)<\/p>$/i);
    return match ? match[1] : html;
}
