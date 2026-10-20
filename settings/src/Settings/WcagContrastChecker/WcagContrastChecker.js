import { memo, useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { checkContrast } from "./colorContrast.js";
import Icon from "../../utils/Icon.js";
import { clsx } from "../../components/ui/cx";

import useFields from "../Fields/FieldsData.js";

// The result pill follows the approved status-callout look (wizard-fields.md §4, Field.js
// COMMENT_TINT): a faded status-surface tint behind BODY text (#0f172a, ≥15:1 on every tint —
// AA-safe, replacing the legacy dark-green/amber/red literals). The pass/fail STATUS is carried by
// the matching tint + the level label + the tooltip; the contrast icon and all pill text render in
// the neutral #0f172a foreground. The icon is NOT colour-coded on purpose: the legacy per-status
// icon colours (via a now-deleted `svg path{fill:currentColor}` rule) left the amber AA icon at
// ~1.74:1 on warning-surface (WCAG 1.4.11 fail); a neutral icon reads AA on every tint and keeps the
// status colour in the swatch (tint) + label. Zero new tokens. (maintainer sign-off 2026-10-20)
const PILL_BASE = clsx(
	"tw-inline-flex tw-items-center tw-gap-[var(--cmplz-space-2xs,_4px)]",
	"tw-px-[var(--cmplz-space-s,_12px)] tw-py-[var(--cmplz-space-2xs,_4px)]",
	"tw-rounded-[var(--cmplz-radius-s,_8px)]",
	"tw-text-[length:var(--cmplz-font-size-sm,_0.8125rem)] tw-font-semibold",
	"tw-text-[color:var(--cmplz-text,_#0f172a)]"
);
const PILL_TINT = {
	AAA: "tw-bg-[var(--cmplz-success-surface,_#e9f6ec)]",
	AA: "tw-bg-[var(--cmplz-warning-surface,_#fbf4da)]",
	Fail: "tw-bg-[var(--cmplz-danger-surface,_#fdebed)]",
};

const debounce = (fn, delay = 100) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

const WcagContrastChecker = (props) => {
    const [results, setResults] = useState([]);

    const comparisons = props.fields?.comparisons || [];
    const fontSize = useFields((state) => state.getFieldValue("font_size"));

    const fieldValues = useFields((state) =>
        comparisons.reduce((acc, cmp) => {
            acc[cmp.foreground_field] = state.getFieldValue(cmp.foreground_field);
            acc[cmp.background_field] = state.getFieldValue(cmp.background_field);
            return acc;
        }, {})
    );

    const tooltipText = {
        AAA: __("AAA: Meets enhanced WCAG 2.1 contrast requirements (≥7:1).", "complianz-gdpr"),
        AA: __("AA: Meets minimum WCAG 2.1 contrast requirements (≥4.5:1).", "complianz-gdpr"),
        Fail: __("Fail: Does not meet WCAG 2.1 minimum contrast (below 4.5:1).", "complianz-gdpr"),
    };

    const computePairs = useCallback(() => {
        return comparisons.map((cmp) => {
        const fgRaw = fieldValues[cmp.foreground_field];
        const bgRaw = fieldValues[cmp.background_field];

        const fg =
            fgRaw && typeof fgRaw === "object" && cmp.foreground_key
            ? fgRaw[cmp.foreground_key]
            : fgRaw;

        const bg =
            bgRaw && typeof bgRaw === "object" && cmp.background_key
            ? bgRaw[cmp.background_key]
            : bgRaw;

        return {
            name: `${cmp.foreground_label} vs ${cmp.background_label}`,
            fg,
            bg,
        };
        });
    }, [comparisons, fieldValues]);

    useEffect(() => {
        const run = debounce(() => {
        const pairs = computePairs();
        const calc = pairs.map((pair) => {
            const { ratio, level, pass } = checkContrast(pair.fg, pair.bg, fontSize);
            return { ...pair, ratio, level, pass };
        });
        setResults(calc);
        }, 100);

        run();
    }, [comparisons, fieldValues, fontSize, computePairs]);

    if (!results.length) return null;

    return (
        <div className="cmplz-contrast-checker" aria-live="polite">
        <ul className="tw-list-none tw-m-0 tw-p-0">
            {results.map((res, i) => (
            <li
                key={i}
                className="cmplz-contrast-row tw-flex tw-justify-start tw-items-center tw-gap-[var(--cmplz-space-s,_12px)] tw-mb-[var(--cmplz-space-xs,_8px)]"
            >
                <span className={clsx("cmplz-contrast-value", PILL_BASE, PILL_TINT[res.level] || PILL_TINT.Fail)}>
                <Icon
                    name="contrast"
                    size={16}
                    color="black"
                    tooltip={tooltipText[res.level]}
                />
                <strong className="tw-font-bold">{res.ratio ? res.ratio.toFixed(2) : "—"}</strong>
                <span className="tw-text-[length:var(--cmplz-font-size-xs,_0.6875rem)] tw-uppercase">{res.level}</span>
                </span>
                <p className="tw-m-0">- {res.name}</p>
            </li>
            ))}
        </ul>
        </div>
    );
};

export default memo(WcagContrastChecker);