import { __ } from '@wordpress/i18n';
import { clsx } from "../components/ui/cx";
import ProgressBlock from "./Progress/ProgressBlock";
import ProgressHeader from "./Progress/ProgressBlockHeader";
import ProgressFooter from "./Progress/ProgressFooter";
import DocumentsBlock from "./Documents/DocumentsBlock";
import DocumentsHeader from "./Documents/DocumentsHeader";
import DocumentsFooter from "./Documents/DocumentsFooter";
import Tools from "./Tools/Tools";
import ToolsHeader from "./Tools/ToolsHeader";
import ToolsFooter from "./Tools/ToolsFooter";
import OtherPlugins from "./OtherPlugins/OtherPlugins";
import TipsTricks from "./TipsTricks/TipsTricks";
import TipsTricksFooter from "./TipsTricks/TipsTricksFooter";
import OtherPluginsHeader from "./OtherPlugins/OtherPluginsHeader";
import FeatureCTA from "./FeatureCTAs/FeatureCTA";
import ErrorBoundary from "../utils/ErrorBoundary";

/*
 * Mapping of components, for use in the config array
 * @type {{SslLabs: JSX.Element}}
 */
var dynamicComponents = {
    "ProgressBlock": ProgressBlock,
    "ProgressHeader": ProgressHeader,
    "ProgressFooter": ProgressFooter,
	"DocumentsBlock": DocumentsBlock,
	"DocumentsHeader": DocumentsHeader,
	"DocumentsFooter": DocumentsFooter,
	"TipsTricks": TipsTricks,
	"TipsTricksFooter": TipsTricksFooter,
	"ToolsHeader": ToolsHeader,
	"ToolsFooter": ToolsFooter,
	"Tools": Tools,
    "OtherPluginsHeader": OtherPluginsHeader,
    "OtherPlugins": OtherPlugins,
    "FeatureCTA": FeatureCTA,
};

// Dashboard GridBlock (T-048, DB-17 / C-4; Stage-H Dashboard). Reads the ADR-015 forward width/variant
// keys (the cmplz_normalize_blocks() output, settings/config/blocks.php) via COMPLETE-LITERAL `tw-` class
// maps (ADR-013; hand-written, no concatenation, no cva) and layers the redesign card chrome on the
// semantic `--cmplz-*` tokens WITH LITERAL FALLBACKS, matching design/dashboard-preview.html. The block is
// MARKERLESS (no data-cmplz-ui of its own): after the ADR-001 MARKER MOVE (Stage H.5 Part 2) the app-root
// marker covers its bodies (the dashboard blocks + OtherPlugins install/activate controls + task HTML),
// which is safe because they are all migrated to the C-2 system (T-048 / H.9) and self-sufficient. The
// `tw-` utilities win via the `important: :is(#complianz,#complianz-portal)` scope (1,1,0) over the shared
// legacy-globals `.cmplz-grid-item*` base (0,1,0) that STAYS for PagePlaceholder/SettingsPlaceholder
// (removed in Phase 5). The cmplz-grid-item + cmplz-<id> hooks (C-3) are kept.
// Logical utilities only (ADR-007); border STYLE is set explicitly (markerless, so base.css B1 does not apply).
const CARD_SHADOW = "tw-shadow-[var(--cmplz-shadow,_0_1px_3px_0_rgba(15,23,42,0.10),_0_1px_2px_-1px_rgba(15,23,42,0.06))]";
const CARD_SURFACE = clsx(
	"tw-bg-[var(--cmplz-surface,_#ffffff)]",
	"tw-border tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	CARD_SHADOW,
);

// width -> complete-literal column span. A width without a literal degrades to span-1 (the shared base
// already sets grid-column: span 1), so only the spans the dashboard actually uses carry a literal.
const WIDTH_CLASS = {
	2: "tw-col-span-2",
};

// variant -> the CARD-level literal set (surface/border/shadow, or borderless = none).
const VARIANT_CARD_CLASS = {
	"default": CARD_SURFACE,
	"edge-to-edge": CARD_SURFACE,
	"borderless": "tw-bg-transparent tw-border-0 tw-shadow-none",
};

// variant -> the HEADER-level literal set (borderless drops the divider + inline padding).
const VARIANT_HEADER_CLASS = {
	"default": "tw-px-[var(--cmplz-space-l,_24px)] tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	"edge-to-edge": "tw-px-[var(--cmplz-space-l,_24px)] tw-border-b tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
	"borderless": "tw-px-0",
};

// variant -> the CONTENT-level literal set. edge-to-edge zeroes the body padding (its rows carry their own
// inline padding); borderless keeps block padding but drops inline padding; default pads both axes.
const VARIANT_CONTENT_CLASS = {
	"default": "tw-py-[var(--cmplz-space-m,_16px)] tw-px-[var(--cmplz-space-l,_24px)]",
	"edge-to-edge": "tw-p-0",
	"borderless": "tw-py-[var(--cmplz-space-m,_16px)] tw-px-0",
};

const cardCls = (variant, width) => clsx(
	"tw-relative tw-flex tw-flex-col tw-overflow-hidden tw-rounded-[var(--cmplz-radius,_12px)]",
	VARIANT_CARD_CLASS[variant] || VARIANT_CARD_CLASS["default"],
	WIDTH_CLASS[width],
);
const headerCls = (variant) => clsx(
	"tw-flex tw-items-center tw-justify-between tw-gap-[var(--cmplz-space-s,_12px)]",
	"tw-min-h-[56px] tw-py-[var(--cmplz-space-m,_16px)]",
	VARIANT_HEADER_CLASS[variant] || VARIANT_HEADER_CLASS["default"],
);
const contentCls = (variant) => clsx(
	"tw-w-full tw-grow",
	VARIANT_CONTENT_CLASS[variant] || VARIANT_CONTENT_CLASS["default"],
);
// Subtle footer shelf (surface-sunken-adjacent slate-50 per the preview) + a block-start divider.
const footerCls = clsx(
	"tw-flex tw-flex-wrap tw-items-center tw-justify-start tw-gap-[var(--cmplz-space-m,_16px)]",
	"tw-py-[var(--cmplz-space-s,_12px)] tw-px-[var(--cmplz-space-l,_24px)]",
	"tw-bg-[#f8fafc] tw-border-t tw-border-solid tw-border-[color:var(--cmplz-border,_#e2e8f0)]",
);

const GridBlock = ({block}) => {
	const blockData = block;
	const variant = blockData.variant || "default";
	const width = blockData.width;
	// ADR-015: a width without a complete-literal in WIDTH_CLASS degrades to span-1; warn devs (the JS
	// equivalent of the PHP _doing_it_wrong) so an unsupported width (e.g. a premium block's width:3) is visible.
	if ( width && ! WIDTH_CLASS[ width ] ) {
		console.warn( 'cmplz: dashboard block "' + blockData.id + '" requested unsupported width ' + width + ' — falling back to span 1.' );
	}
	// A `fullWidth` block spans the whole auto-fit grid row (grid-column: 1 / -1) — used by the
	// feature-CTA row so its internal responsive card grid fills the dashboard width (ADR-013 literal).
	const className = clsx("cmplz-grid-item", "cmplz-" + blockData.id, cardCls(variant, width), blockData.fullWidth && "tw-col-span-full");
	const footer =block.footer ? block.footer.data : false;

	return (
		<ErrorBoundary fallback={"Could not load:"+' '+blockData.id}>
			<div key={"block-"+blockData.id} className={className}>
				{blockData.header && <div className={clsx("cmplz-grid-item-header", headerCls(variant))}>
					{blockData.header.type==='text' && <>
						<h3 className="cmplz-grid-title cmplz-h4 tw-m-0">{ blockData.header.data }</h3>
						<div className="cmplz-grid-item-controls tw-flex tw-items-center tw-gap-[var(--cmplz-space-s,_12px)]">
							{blockData.controls && blockData.controls.type==='url' && <a href={blockData.controls.data}>{__("Instructions", "complianz-gdpr")}</a>}
							{blockData.controls && blockData.controls.type==='react' && wp.element.createElement(dynamicComponents[blockData.controls.data])}
						</div>
					</>}
					{blockData.header.type==='react' && <>
						{ wp.element.createElement(dynamicComponents[blockData.header.data])}
					</>}
				</div>}
				 <div className={clsx("cmplz-grid-item-content", contentCls(variant))}>{wp.element.createElement(dynamicComponents[block.content.data], {block})}</div>

				{!footer && <div className="cmplz-grid-item-footer"></div>}
				{footer && <div className={clsx("cmplz-grid-item-footer", footerCls, "empty:tw-hidden")}>{wp.element.createElement(dynamicComponents[block.footer.data])}</div>}

			</div>
		</ErrorBoundary>
	);

}

export default GridBlock;
