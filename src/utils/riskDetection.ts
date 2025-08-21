/**
 * Utilitaire pour la détection et gestion des risques météo
 * Utilisé pour afficher les "!" rouges sur les icônes de tranches horaires
 */

import { TimeSlotData } from "@/types/dailyData";

// Mapping des codes WMO vers les types de risque
const WMO_RISK_MAPPING: Record<number, string> = {
    95: "Orage",
    96: "Orage grêle",
    99: "Orage grêle",
    80: "Averse",
    81: "Averse",
    82: "Averse violente",
    56: "Pluie glaçante",
    57: "Pluie glaçante",
    66: "Pluie glaçante",
    67: "Pluie glaçante",
    48: "Brouillard givrant",
    85: "Neige convective",
    86: "Neige convective"
};

// Ordre de priorité des risques (plus prioritaire = index plus bas)
const RISK_PRIORITY_ORDER = [
    "Orage grêle",
    "Orage",
    "Pluie glaçante",
    "Brouillard givrant",
    "Averse violente",
    "Neige convective",
    "Averse"
];

/**
 * Détermine le type de risque d'un code WMO
 */
export function getRiskFromWMO(wmoCode: number): string | null {
    return WMO_RISK_MAPPING[wmoCode] || null;
}

/**
 * Compare la priorité de deux risques
 * @returns true si risk1 est plus prioritaire que risk2
 */
function isHigherPriority(risk1: string, risk2: string): boolean {
    const priority1 = RISK_PRIORITY_ORDER.indexOf(risk1);
    const priority2 = RISK_PRIORITY_ORDER.indexOf(risk2);

    // -1 signifie non trouvé, donc moins prioritaire
    if (priority1 === -1) return false;
    if (priority2 === -1) return true;

    return priority1 < priority2; // Plus petit index = plus prioritaire
}

/**
 * Analyse une tranche horaire pour déterminer s'il faut afficher un "!" de risque
 * @param timeSlot - Données de la tranche horaire
 * @returns Objet avec shouldShowRisk et riskTooltip
 */
export function analyzeSlotRisk(timeSlot: TimeSlotData): {
    shouldShowRisk: boolean;
    riskTooltip: string;
    primaryRisk?: string;
} {
    if (!timeSlot.risques || timeSlot.risques.length === 0) {
        return {
            shouldShowRisk: false,
            riskTooltip: ""
        };
    }

    // Trouver le risque le plus prioritaire dans la tranche
    let highestPriorityRisk: string | null = null;
    let riskHours: string[] = [];

    timeSlot.risques.forEach(risk => {
        if (!highestPriorityRisk || isHigherPriority(risk.type, highestPriorityRisk)) {
            if (risk.type !== highestPriorityRisk) {
                // Nouveau risque plus prioritaire, reset les heures
                highestPriorityRisk = risk.type;
                riskHours = [risk.tranche];
            }
        } else if (risk.type === highestPriorityRisk) {
            // Même risque, ajouter l'heure
            riskHours.push(risk.tranche);
        }
    });

    if (!highestPriorityRisk) {
        return {
            shouldShowRisk: false,
            riskTooltip: ""
        };
    }

    // Vérifier si l'icône de la tranche représente déjà ce risque
    const slotIconRisk = timeSlot.code_wmo_final ? getRiskFromWMO(timeSlot.code_wmo_final) : null;

    // Ne pas afficher le "!" si l'icône représente déjà le même risque ou un risque plus prioritaire
    const shouldShowRisk = !slotIconRisk || isHigherPriority(highestPriorityRisk, slotIconRisk);

    // Créer le tooltip
    const riskTooltip = `${highestPriorityRisk} prévu à ${riskHours.join(", ")}`;

    return {
        shouldShowRisk,
        riskTooltip,
        primaryRisk: highestPriorityRisk
    };
}

/**
 * Formate les heures pour l'affichage dans le tooltip
 */
function formatRiskHours(hours: string[]): string {
    if (hours.length === 0) return "";
    if (hours.length === 1) return hours[0];

    // Trier et grouper les heures consécutives
    return hours.join(", ");
}

/**
 * Retourne la couleur du badge de risque selon le type
 */
export function getRiskBadgeColor(riskType: string): string {
    switch (riskType) {
        case "Orage grêle":
            return "#dc2626"; // Rouge foncé
        case "Orage":
            return "#ef4444"; // Rouge
        case "Pluie glaçante":
            return "#3b82f6"; // Bleu
        case "Brouillard givrant":
            return "#6366f1"; // Indigo
        case "Averse violente":
            return "#f59e0b"; // Orange
        default:
            return "#dc2626"; // Rouge par défaut
    }
}

