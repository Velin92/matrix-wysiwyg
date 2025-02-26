/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
    computeNodeAndOffset,
    countCodeunit,
    getCurrentSelection,
} from './dom';

let beforeEditor: HTMLDivElement;
let editor: HTMLDivElement;
let afterEditor: HTMLDivElement;

beforeAll(() => {
    beforeEditor = document.createElement('div');
    editor = document.createElement('div');
    editor.setAttribute('contentEditable', 'true');
    afterEditor = document.createElement('div');
    document.body.appendChild(beforeEditor);
    document.body.appendChild(editor);
    document.body.appendChild(afterEditor);
});

function setEditorHtml(html: string) {
    // The editor always needs an extra BR after your HTML
    editor.innerHTML = html + '<br />';
}

describe('computeNodeAndOffset', () => {
    it('Should find at the start of simple text', () => {
        // When
        setEditorHtml('abcdefgh');
        const { node, offset } = computeNodeAndOffset(editor, 0);

        // Then
        expect(node).toBe(editor.childNodes[0]);
        expect(offset).toBe(0);
    });

    it('Should find in the middle of simple text', () => {
        // When
        setEditorHtml('abcdefgh');
        const { node, offset } = computeNodeAndOffset(editor, 4);

        // Then
        expect(node).toBe(editor.childNodes[0]);
        expect(offset).toBe(4);
    });

    it('Should find at the end of simple text', () => {
        // When
        setEditorHtml('abcdefgh');
        const { node, offset } = computeNodeAndOffset(editor, 8);

        // Then
        expect(node).toBe(editor.childNodes[0]);
        expect(offset).toBe(8);
    });

    it('Should return null if off the end', () => {
        // When
        setEditorHtml('abcdefgh');
        // 8 characters, plus the br we always append = 9, so 10 is off end
        const { node, offset } = computeNodeAndOffset(editor, 10);

        // Then
        expect(node).toBeNull();
        expect(offset).toBe(1);
    });

    it('Should find before subnode', () => {
        // When
        setEditorHtml('abc<b>def</b>gh');
        const { node, offset } = computeNodeAndOffset(editor, 2);

        // Then
        expect(node).toBe(editor.childNodes[0]);
        expect(offset).toBe(2);
    });

    it('Should find after subnode', () => {
        // When
        setEditorHtml('abc<b>def</b>gh');
        const { node, offset } = computeNodeAndOffset(editor, 4);

        // Then
        expect(node).toBe(editor.childNodes[1].childNodes[0]);
        expect(offset).toBe(1);
    });

    it('Should find inside subnode', () => {
        // When
        setEditorHtml('abc<b>def</b>gh');
        const { node, offset } = computeNodeAndOffset(editor, 7);

        // Then
        expect(node).toBe(editor.childNodes[2]);
        expect(offset).toBe(1);
    });

    it('Should find after subnode', () => {
        // When
        setEditorHtml('abc<b>def</b>gh');
        const { node, offset } = computeNodeAndOffset(editor, 7);

        // Then
        expect(node).toBe(editor.childNodes[2]);
        expect(offset).toBe(1);
    });

    it('Should find before br', () => {
        // When
        setEditorHtml('a<br />b');
        const { node, offset } = computeNodeAndOffset(editor, 0);

        // Then
        expect(node).toBe(editor.childNodes[0]);
        expect(offset).toBe(0);
    });

    it('Should find br start', () => {
        // When
        setEditorHtml('a<br />b');
        const { node, offset } = computeNodeAndOffset(editor, 1);

        // Then
        expect(node).toBe(editor.childNodes[0]);
        expect(offset).toBe(1);
    });

    it('Should find br end', () => {
        // When
        setEditorHtml('a<br />b');
        const { node, offset } = computeNodeAndOffset(editor, 2);

        // Then
        expect(node).toBe(editor.childNodes[2]);
        expect(offset).toBe(0);
    });

    it('Should find between br', () => {
        // When
        setEditorHtml('a<br /><br />b');
        const { node, offset } = computeNodeAndOffset(editor, 2);

        // Then
        expect(node).toBe(editor.childNodes[2]);
        expect(offset).toBe(0);
    });

    it('Should find br at end', () => {
        // When
        setEditorHtml('abc<br />');
        const { node, offset } = computeNodeAndOffset(editor, 4);

        // Then
        expect(node).toBe(editor.childNodes[2]);
        expect(offset).toBe(0);
    });

    it('Should find after br', () => {
        // When
        setEditorHtml('a<br />b');
        const { node, offset } = computeNodeAndOffset(editor, 3);

        // Then
        expect(node).toBe(editor.childNodes[2]);
        expect(offset).toBe(1);
    });

    it('Should find inside an empty list', () => {
        // When
        setEditorHtml('<ul><li><li></ul>');
        const { node, offset } = computeNodeAndOffset(editor, 0);

        // Then
        expect(node).toBe(editor.childNodes[0].childNodes[0]);
        expect(offset).toBe(0);
    });

    it('Should find inside two empty list', () => {
        // When
        setEditorHtml('<ul><li><li></ul><li><li></ul>');
        const { node, offset } = computeNodeAndOffset(editor, 0);

        // Then
        expect(node).toBe(editor.childNodes[0].childNodes[0]);
        expect(offset).toBe(0);
    });

    it('Should find inside a list', () => {
        // When
        setEditorHtml('<ul><li>foo<li></ul>');
        const { node, offset } = computeNodeAndOffset(editor, 1);

        // Then
        expect(node).toBe(editor.childNodes[0].childNodes[0].childNodes[0]);
        expect(offset).toBe(1);
    });
});

describe('countCodeunit', () => {
    it('Should count ASCII', () => {
        // When
        setEditorHtml('abcdefgh');
        const textNode = editor.childNodes[0];

        // Then
        expect(countCodeunit(editor, textNode, 0)).toBe(0);
        expect(countCodeunit(editor, textNode, 3)).toBe(3);
        expect(countCodeunit(editor, textNode, 7)).toBe(7);
        // Just past the end is allowed
        expect(countCodeunit(editor, textNode, 8)).toBe(8);
        // But not past that
        expect(countCodeunit(editor, textNode, 9)).toBe(-1);
    });

    it('Should count UCS-2', () => {
        // When
        setEditorHtml('a\u{03A9}b\u{03A9}c');
        const textNode = editor.childNodes[0];

        // Then
        expect(countCodeunit(editor, textNode, 0)).toBe(0);
        expect(countCodeunit(editor, textNode, 1)).toBe(1);
        expect(countCodeunit(editor, textNode, 4)).toBe(4);
        expect(countCodeunit(editor, textNode, 5)).toBe(5);
        expect(countCodeunit(editor, textNode, 6)).toBe(-1);
    });

    it('Should count complex', () => {
        // When
        setEditorHtml('a\u{1F469}\u{1F3FF}\u{200D}\u{1F680}b');
        const textNode = editor.childNodes[0];

        // Then
        expect(countCodeunit(editor, textNode, 0)).toBe(0);
        expect(countCodeunit(editor, textNode, 7)).toBe(7);
        expect(countCodeunit(editor, textNode, 8)).toBe(8);
        expect(countCodeunit(editor, textNode, 9)).toBe(9);
        expect(countCodeunit(editor, textNode, 10)).toBe(-1);
    });

    it('Should count nested', () => {
        // When
        setEditorHtml('a<b>b</b>c');
        const firstTextNode = editor.childNodes[0];
        const boldTextNode = editor.childNodes[1].childNodes[0];
        const thirdTextNode = editor.childNodes[2];

        // Then
        expect(countCodeunit(editor, firstTextNode, 0)).toBe(0);
        expect(countCodeunit(editor, boldTextNode, 0)).toBe(1);
        expect(countCodeunit(editor, thirdTextNode, 0)).toBe(2);
    });

    it('Should treat br as a character', () => {
        // When
        setEditorHtml('a<br />b');
        const firstTextNode = editor.childNodes[0];
        const brNode = editor.childNodes[1];
        const secondTextNode = editor.childNodes[2];

        // Then
        expect(countCodeunit(editor, firstTextNode, 0)).toBe(0);
        expect(countCodeunit(editor, brNode, 1)).toBe(2);
        expect(countCodeunit(editor, secondTextNode, 1)).toBe(3);
    });

    it('Should work with deeply nested', () => {
        // When
        setEditorHtml('aaa<b><i>bbb</i>ccc</b>ddd');
        const firstTextNode = editor.childNodes[0];
        const boldItalicTextNode =
            editor.childNodes[1].childNodes[0].childNodes[0];
        const boldOnlyTextNode = editor.childNodes[1].childNodes[1];
        const thirdTextNode = editor.childNodes[2];

        // Then
        expect(countCodeunit(editor, firstTextNode, 1)).toBe(1);
        expect(countCodeunit(editor, firstTextNode, 2)).toBe(2);
        expect(countCodeunit(editor, firstTextNode, 3)).toBe(3);
        expect(countCodeunit(editor, boldItalicTextNode, 0)).toBe(3);
        expect(countCodeunit(editor, boldItalicTextNode, 1)).toBe(4);
        expect(countCodeunit(editor, boldItalicTextNode, 2)).toBe(5);
        expect(countCodeunit(editor, boldOnlyTextNode, 0)).toBe(6);
        expect(countCodeunit(editor, boldOnlyTextNode, 1)).toBe(7);
        expect(countCodeunit(editor, boldOnlyTextNode, 2)).toBe(8);
        expect(countCodeunit(editor, thirdTextNode, 0)).toBe(9);
        expect(countCodeunit(editor, thirdTextNode, 1)).toBe(10);
        expect(countCodeunit(editor, thirdTextNode, 2)).toBe(11);
    });
});

describe('getCurrentSelection', () => {
    class FakeSelection {
        anchorNode: Node | null = null;
        anchorOffset = 0;
        focusNode: Node | null = null;
        focusOffset = 0;

        get isCollapsed(): boolean {
            throw new Error('Not implemented!');
        }
        get rangeCount(): number {
            throw new Error('Not implemented!');
        }
        get type(): string {
            throw new Error('Not implemented!');
        }
        addRange() {
            throw new Error('Not implemented!');
        }
        collapse() {
            throw new Error('Not implemented!');
        }
        collapseToEnd() {
            throw new Error('Not implemented!');
        }
        collapseToStart() {
            throw new Error('Not implemented!');
        }
        containsNode(_: Node): boolean {
            throw new Error('Not implemented!');
        }
        empty() {
            throw new Error('Not implemented!');
        }
        deleteFromDocument() {
            throw new Error('Not implemented!');
        }
        getRangeAt(): Range {
            throw new Error('Not implemented!');
        }
        modify() {
            throw new Error('Not implemented!');
        }
        removeRange() {
            throw new Error('Not implemented!');
        }
        removeAllRanges() {
            throw new Error('Not implemented!');
        }
        setPosition() {
            throw new Error('Not implemented!');
        }
        toString(): string {
            throw new Error('Not implemented!');
        }

        extend(focusNode: Node | null, focusOffset = 0) {
            this.focusNode = focusNode;
            this.focusOffset = focusOffset;
        }

        selectAllChildren(node: Node) {
            this.anchorNode = node;
            this.anchorOffset = 0;
            this.focusNode = node;
            this.focusOffset = node.childNodes.length;
        }

        setBaseAndExtent(
            anchorNode: Node | null,
            anchorOffset: number,
            focusNode: Node | null,
            focusOffset: number,
        ) {
            this.anchorNode = anchorNode;
            this.anchorOffset = anchorOffset;
            this.focusNode = focusNode;
            this.focusOffset = focusOffset;
        }
    }

    function lastTextNode(): Node | null {
        for (let i = editor.childNodes.length - 1; i >= 0; i--) {
            const n = editor.childNodes[i];
            if (n.nodeType === Node.TEXT_NODE && n.textContent !== '\n') {
                return n;
            }
        }
        return null;
    }

    function indexOf(child: Node, parent: Node) {
        let i = 0;
        for (const ch of parent.childNodes) {
            if (ch.isSameNode(child)) {
                return i;
            }
            i++;
        }
        return -1;
    }

    /** Like selecting something before the editor */
    function selectionBeforeEditor(): FakeSelection {
        const sel = new FakeSelection();
        sel.setBaseAndExtent(beforeEditor, 0, beforeEditor, 0);
        return sel;
    }

    /** Like selecting something before the editor */
    function selectionAfterEditor(): FakeSelection {
        const sel = new FakeSelection();
        sel.setBaseAndExtent(afterEditor, 0, afterEditor, 0);
        return sel;
    }

    /** Like clicking at the beginning */
    function cursorToBeginning(): FakeSelection {
        const sel = new FakeSelection();
        const node = editor.firstChild;
        sel.setBaseAndExtent(node, 0, node, 0);
        return sel;
    }

    /** Click at the end then press down arrow */
    function cursorToAfterEnd(): FakeSelection {
        const sel = new FakeSelection();
        const offset = editor.childNodes.length - 1;
        sel.setBaseAndExtent(editor, offset, editor, offset);
        return sel;
    }

    /** Click at the end */
    function cursorToEnd(): FakeSelection {
        const sel = new FakeSelection();
        const textNode = lastTextNode();
        if (textNode) {
            const len = textNode.textContent?.length ?? 0;
            sel.setBaseAndExtent(textNode, len, textNode, len);
        }
        return sel;
    }

    /** Moves to the supplied node at the supplied offset. Ignores the offset
     * if you supply a non-text node, and places you immediately BEFORE the
     * supplied node. */
    function cursorToNode(node: Node, offset: number): FakeSelection {
        const sel = new FakeSelection();
        if (node.nodeType === Node.TEXT_NODE) {
            // Text node - refer to it, with index at end
            sel.setBaseAndExtent(node, offset, node, offset);
        } else {
            // Find parent and point to this node within the parent
            const parent = node.parentNode;
            if (parent) {
                const idx = indexOf(node, parent);
                sel?.setBaseAndExtent(parent, idx, parent, idx);
            }
        }
        return sel;
    }

    /** An alternative way of selecting a node - this is not possible
     * to do by clicking, but it is the way we select nodes when we
     * get a selection back from the ComposerModel sometimes. */
    function cursorToNodeDirectly(node: Node, offset: number): FakeSelection {
        const sel = new FakeSelection();
        sel.setBaseAndExtent(node, offset, node, offset);
        return sel;
    }

    function selectAll(): FakeSelection {
        const sel = new FakeSelection();
        sel.selectAllChildren(editor);
        return sel;
    }

    function selectStartToEnd(): FakeSelection {
        const sel = new FakeSelection();
        const textNode = lastTextNode();
        if (textNode && editor.firstChild) {
            sel?.setBaseAndExtent(
                editor.firstChild,
                0,
                textNode,
                textNode.textContent?.length ?? 0,
            );
        }
        return sel;
    }

    function selectEndToStart() {
        const sel = cursorToEnd();
        editor.firstChild && sel.extend(editor.firstChild);
        return sel;
    }

    function select(
        node1: Node,
        offset1: number,
        node2: Node,
        offset2: number,
    ): FakeSelection {
        const sel = cursorToNode(node1, offset1);

        if (!node2.parentNode) {
            return sel;
        }

        let n2: Node;
        let o2: number;
        if (node2.nodeType === Node.TEXT_NODE) {
            o2 = offset2;
            n2 = node2;
        } else {
            o2 = indexOf(node2, node2.parentNode);
            n2 = node2.parentNode;
        }

        sel.extend(n2, o2);
        return sel;
    }

    /** Select from the end to the supplied node. If node is not a text node,
     * offset is ignored, and the selection starts BEFORE node. */
    function selectEndTo(node: Node, offset: number): FakeSelection {
        const sel = cursorToEnd();

        if (!node.parentNode) {
            return sel;
        }

        let n: Node;
        let o: number;
        if (node.nodeType === Node.TEXT_NODE) {
            o = offset;
            n = node;
        } else {
            o = indexOf(node, node.parentNode);
            n = node.parentNode;
        }

        sel.extend(n, o);
        return sel;
    }

    it('correctly locates the cursor after a br tag', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const secondBr = editor.childNodes[2];
        assert(secondBr);
        const sel = cursorToNode(secondBr, 0);

        // Sanity: the focusNode and anchorNode are the editor object, not one
        // of the text nodes inside it, and the offset tells you which node
        // inside editor is immediately after the cursor.
        expect(sel.anchorNode).toBe(editor);
        expect(sel.anchorOffset).toBe(2);
        expect(sel.focusNode).toBe(editor);
        expect(sel.focusOffset).toBe(2);

        // We should see ourselves as on code unit 7, because the BR
        // counts as 1.
        expect(getCurrentSelection(editor, sel)).toEqual([7, 7]);
    });

    it('correctly locates the cursor after a br tag selected directly', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const secondBr = editor.childNodes[2];
        assert(secondBr);
        const sel = cursorToNodeDirectly(secondBr, 0);

        // Sanity: the focusNode and anchorNode are the BR itself
        expect(sel.anchorNode).toBe(secondBr);
        expect(sel.anchorOffset).toBe(0);
        expect(sel.focusNode).toBe(secondBr);
        expect(sel.focusOffset).toBe(0);

        // We should see ourselves as on code unit 7, because the BR
        // counts as 1.
        expect(getCurrentSelection(editor, sel)).toEqual([7, 7]);
    });

    it('correctly locates the cursor on a new line inside another tag', () => {
        setEditorHtml('pa<strong>ra 1<br /><br />pa</strong>ra 2');
        const strong = editor.childNodes[1];
        const secondBr = strong.childNodes[2];
        assert(secondBr);
        const sel = cursorToNode(secondBr, 0);

        // Sanity: the focusNode and anchorNode are the editor object, not one
        // of the text nodes inside it, and the offset tells you which node
        // inside editor is immediately after the cursor.
        expect(sel.anchorNode).toBe(strong);
        expect(sel.anchorOffset).toBe(2);
        expect(sel.focusNode).toBe(strong);
        expect(sel.focusOffset).toBe(2);

        // We should see ourselves as on code unit 7, because the BR
        // counts as 1.
        expect(getCurrentSelection(editor, sel)).toEqual([7, 7]);
    });

    it('correctly finds backward selections ending after a BR', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const secondBr = editor.childNodes[2];
        assert(secondBr);
        const sel = selectEndTo(secondBr, 0);

        // Sanity
        expect(sel.anchorNode).toBe(editor.childNodes[3]);
        expect(sel.anchorOffset).toBe(6);
        expect(sel.focusNode).toBe(editor);
        expect(sel.focusOffset).toBe(2);

        // We should see ourselves as on code unit 7, because the BR
        // counts as 1.
        expect(getCurrentSelection(editor, sel)).toEqual([14, 7]);
    });

    it('handles selecting all with ctrl-a', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const sel = selectAll();

        // Not 14 here because the last BR gets counted?
        expect(getCurrentSelection(editor, sel)).toEqual([0, 15]);
    });

    it('handles selecting all by dragging', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const sel = selectStartToEnd();
        expect(getCurrentSelection(editor, sel)).toEqual([0, 14]);
    });

    it('handles selecting all by dragging backwards', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const sel = selectEndToStart();
        expect(getCurrentSelection(editor, sel)).toEqual([14, 0]);
    });

    it('handles selecting across multiple newlines', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const p1 = editor.childNodes[0];
        const p2 = editor.childNodes[3];
        const sel = select(p1, 2, p2, 3);
        expect(getCurrentSelection(editor, sel)).toEqual([2, 11]);
    });

    it('handles cursor after end', () => {
        setEditorHtml('para 1<br /><br />para 2');
        // Simulate going to end of doc and pressing down arrow
        const sel = cursorToAfterEnd();
        expect(getCurrentSelection(editor, sel)).toEqual([14, 14]);
    });

    it('handles cursor at start', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const sel = cursorToBeginning();
        expect(getCurrentSelection(editor, sel)).toEqual([0, 0]);
    });

    it('handles selection before the start by returning 0, 0', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const sel = selectionBeforeEditor();
        expect(getCurrentSelection(editor, sel)).toEqual([0, 0]);
    });

    it('handles selection after the end by returning last character', () => {
        setEditorHtml('para 1<br /><br />para 2');
        const sel = selectionAfterEditor();
        expect(getCurrentSelection(editor, sel)).toEqual([15, 15]);
    });
});
