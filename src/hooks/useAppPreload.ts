"use client";

import { useEffect, useMemo, useState } from "react";
import { USE_EMOJI_ICONS } from "../shared/uiFlags";
import { getWeatherIcon } from "@/utils/wmoFinalIcons";

/**
 * Précharge minimal: mapping WMO→emoji/PNG et quelques ressources clés.
 * Vise < ~600ms sur mobile, s'arrête dès que le premier écran est prêt.
 */
export function useAppPreload() {
    const [isReady, setReady] = useState(false);

    const warmupList = useMemo(() => {
        // Un sous-ensemble des codes WMO fréquents
        const wmoSamples = [0, 1, 2, 3, 45, 51, 61, 80, 95];
        const night = false;
        return wmoSamples.map((code) => getWeatherIcon(code, night, USE_EMOJI_ICONS));
    }, []);

    useEffect(() => {
        let done = false;
        const markReady = () => { if (!done) { done = true; setReady(true); } };

        // Emoji: rien à faire, PNG: précharger quelques icônes
        if (!USE_EMOJI_ICONS) {
            const imgs = warmupList
                .filter((src) => typeof src === "string" && src.startsWith("/"))
                .slice(0, 6)
                .map((src) => {
                    const img = new Image();
                    img.src = src;
                    return img;
                });
            // Timeout de garde pour ne pas bloquer
            const t = setTimeout(markReady, 600);
            return () => clearTimeout(t);
        }

        // Emoji: rendu instantané
        const t = setTimeout(markReady, 150);
        return () => clearTimeout(t);
    }, [warmupList]);

    return { isReady };
}


