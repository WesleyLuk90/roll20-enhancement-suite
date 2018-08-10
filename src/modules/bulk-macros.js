import { createElement } from '../tools/createElement.js'
import { R20Module } from "../tools/r20Module"
import { R20 } from '../tools/r20api.js';

const bulkMarcoMenuId = "r20es-bulk-macro-menu";

class BulkMacroModule extends R20Module.OnAppLoadBase {
    constructor(id) {
        super(id);
        this.observerCallback = this.observerCallback.bind(this);
        this.menuClick = this.menuClick.bind(this);
        this.actionAttribute = "r20es-macro-action";
    }

    menuClick(obj) {

        if (!obj.target) return;

        let action = obj.target.getAttribute(this.actionAttribute);
        if (!action) return;

        const sel = R20.getSelectedTokens();
        R20.unselectTokens();

        for (let obj of sel) {
            R20.selectToken(obj);
            R20.say(action);
        }

        R20.hideTokenRadialMenu();
        R20.hideTokenContextMenu();

        for (let obj of sel) {
            R20.addTokenToSelection(obj);
        }
    }

    observerCallback(muts) {

        const sel = R20.getSelectedTokens();
        if (sel.length <= 0) return;

        const addMacro = (macro, arr) => arr[macro.get("id")] = {
            name: macro.get("name"),
            action: macro.get("action")
        };

        let root = document.getElementById(bulkMarcoMenuId);
        if (!root || root.childElementCount > 0) return;

        for (var e of muts) {
            for (let node of e.addedNodes) {
                if (node.className && node.className === "actions_menu d20contextmenu") {

                    let macros = {};

                    const player = R20.getCurrentPlayer()
                    for (let macro of player.macros.models) {
                        addMacro(macro, macros);
                    }

                    const chars = sel
                        .reduce((accum, obj) => {

                            if(!obj.model) {
                                accum.uniq++;
                                return accum;
                            }

                            const  id = obj.model.character
                                ? obj.model.character.get("id")
                                : obj.model.get("id");
                            
                            if (!(id in accum.map)) {
                                accum.uniq++;
                                accum.map[id] = true;

                                if(obj.model.character) {
                                    accum.arr.push(obj.model.character);
                                }
                            }
                            return accum;
                        }, { map: {}, arr: [], uniq: 0 });

                    if (chars.uniq === 1 && chars.arr.length > 0) {
                        for (let macro of chars.arr[0].abilities.models) {
                            addMacro(macro, macros);
                        }
                    }

                    // create menu options
                    for (let id in macros) {
                        let macro = macros[id];
//                        macro.action = macro.action.replace("@{selected|", `@{${selCharacter.get("name")}|`);

                        createElement("li", {
                            style: {whiteSpace: "nowrap"},
                            "data-action-type": bulkMarcoMenuId,
                            [this.actionAttribute]: macro.action,
                            innerHTML: macro.name,
                            onClick: this.menuClick
                        }, null, root);
                    }
                }
            }
        }
    }

    setup() {
        this.observer = new MutationObserver(this.observerCallback);
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    dispose() {
        super.dispose();
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

if (R20Module.canInstall()) new BulkMacroModule(__filename).install();

const hook = R20Module.makeHook(__filename, {
    id: "bulkMacros",
    name: "Bulk macros",
    description: `Adds a "Bulk Macros" option to the token right click menu which lists macros that can be rolled for the whole selection in bulk.`,
    category: R20Module.category.token,
    gmOnly: true,

    includes: "/editor/",
    find: "<li class='head hasSub' data-action-type='addturn'>Add Turn</li>",
    patch: `<li class='head hasSub' data-action-type='addturn'>Add Turn</li>
<li class="head hasSub" data-menuname="${bulkMarcoMenuId}">Bulk Roll »
<ul class="submenu" id="${bulkMarcoMenuId}" data-menuname="${bulkMarcoMenuId}" style="width: auto;display: none;">
</ul>`,

});

export { hook as BulkMacroHook }