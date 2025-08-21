/**
 * Service de comptage des appels API avec limites temporelles
 * Chaque appel API1 coûte 12.1 calls selon les paramètres OpenMeteo
 */

export interface ApiCallsStats {
    minute: { count: number; limit: number; resetTime: string };
    hour: { count: number; limit: number; resetTime: string };
    day: { count: number; limit: number; resetTime: string };
    month: { count: number; limit: number; resetTime: string };
    lastUpdate: string;
    source?: 'client' | 'server';
}

class ApiCallsCounter {
    private static instance: ApiCallsCounter;
    private counters = {
        minute: 0,
        hour: 0,
        day: 0,
        month: 0
    };

    private limits = {
        minute: 600,
        hour: 5000,
        day: 10000,
        month: 300000
    };

    private lastReset = {
        minute: new Date(),
        hour: new Date(),
        day: new Date(),
        month: new Date()
    };

    private readonly COST_PER_CALL = 12.1; // Coût d'un appel à API1

    public static getInstance(): ApiCallsCounter {
        if (!ApiCallsCounter.instance) {
            ApiCallsCounter.instance = new ApiCallsCounter();
        }
        return ApiCallsCounter.instance;
    }

    /**
     * Enregistre un appel API et met à jour les compteurs
     */
    public recordApiCall(): void {
        const now = new Date();

        // Vérifier et reset les compteurs si nécessaire
        this.checkAndResetCounters(now);

        // Incrémenter tous les compteurs
        this.counters.minute += this.COST_PER_CALL;
        this.counters.hour += this.COST_PER_CALL;
        this.counters.day += this.COST_PER_CALL;
        this.counters.month += this.COST_PER_CALL;

        console.log(`📊 [ApiCallsCounter] +${this.COST_PER_CALL} calls | Minute: ${this.counters.minute}/${this.limits.minute}`);
    }

    /**
     * Vérifie et reset automatiquement les compteurs selon les périodes
     */
    private checkAndResetCounters(now: Date): void {
        // Reset minute (chaque minute)
        if (now.getMinutes() !== this.lastReset.minute.getMinutes() ||
            now.getHours() !== this.lastReset.minute.getHours()) {
            this.counters.minute = 0;
            this.lastReset.minute = now;
            console.log(`🔄 [ApiCallsCounter] Reset compteur minute`);
        }

        // Reset hour (chaque heure)
        if (now.getHours() !== this.lastReset.hour.getHours() ||
            now.getDate() !== this.lastReset.hour.getDate()) {
            this.counters.hour = 0;
            this.lastReset.hour = now;
            console.log(`🔄 [ApiCallsCounter] Reset compteur heure`);
        }

        // Reset day (chaque jour à 00h)
        if (now.getDate() !== this.lastReset.day.getDate()) {
            this.counters.day = 0;
            this.lastReset.day = now;
            console.log(`🔄 [ApiCallsCounter] Reset compteur jour`);
        }

        // Reset month (chaque 1er du mois)
        if (now.getMonth() !== this.lastReset.month.getMonth() ||
            now.getFullYear() !== this.lastReset.month.getFullYear()) {
            this.counters.month = 0;
            this.lastReset.month = now;
            console.log(`🔄 [ApiCallsCounter] Reset compteur mois`);
        }
    }

    /**
     * Récupère les statistiques actuelles
     */
    public getStats(): ApiCallsStats {
        const now = new Date();
        this.checkAndResetCounters(now);

        return {
            minute: {
                count: Math.round(this.counters.minute * 10) / 10,
                limit: this.limits.minute,
                resetTime: this.getNextResetTime('minute')
            },
            hour: {
                count: Math.round(this.counters.hour * 10) / 10,
                limit: this.limits.hour,
                resetTime: this.getNextResetTime('hour')
            },
            day: {
                count: Math.round(this.counters.day * 10) / 10,
                limit: this.limits.day,
                resetTime: this.getNextResetTime('day')
            },
            month: {
                count: Math.round(this.counters.month * 10) / 10,
                limit: this.limits.month,
                resetTime: this.getNextResetTime('month')
            },
            lastUpdate: now.toLocaleTimeString('fr-FR'),
            source: 'client' as const
        };
    }

    /**
     * Calcule le prochain reset pour une période donnée
     */
    private getNextResetTime(period: 'minute' | 'hour' | 'day' | 'month'): string {
        const now = new Date();
        let next = new Date(now);

        switch (period) {
            case 'minute':
                next.setMinutes(now.getMinutes() + 1, 0, 0);
                break;
            case 'hour':
                next.setHours(now.getHours() + 1, 0, 0, 0);
                break;
            case 'day':
                next.setDate(now.getDate() + 1);
                next.setHours(0, 0, 0, 0);
                break;
            case 'month':
                next.setMonth(now.getMonth() + 1, 1);
                next.setHours(0, 0, 0, 0);
                break;
        }

        return next.toLocaleString('fr-FR');
    }

    /**
     * Vérifie si un type d'appel est autorisé (sous la limite)
     */
    public canMakeCall(): { allowed: boolean; blockedBy?: string } {
        this.checkAndResetCounters(new Date());

        if (this.counters.minute + this.COST_PER_CALL > this.limits.minute) {
            return { allowed: false, blockedBy: 'minute' };
        }
        if (this.counters.hour + this.COST_PER_CALL > this.limits.hour) {
            return { allowed: false, blockedBy: 'hour' };
        }
        if (this.counters.day + this.COST_PER_CALL > this.limits.day) {
            return { allowed: false, blockedBy: 'day' };
        }
        if (this.counters.month + this.COST_PER_CALL > this.limits.month) {
            return { allowed: false, blockedBy: 'month' };
        }

        return { allowed: true };
    }

    /**
     * Reset manuel de tous les compteurs (pour debug)
     */
    public resetAll(): void {
        this.counters = { minute: 0, hour: 0, day: 0, month: 0 };
        const now = new Date();
        this.lastReset = { minute: now, hour: now, day: now, month: now };
        console.log(`🔄 [ApiCallsCounter] Reset manuel de tous les compteurs`);
    }
}

// Singleton instance
export const apiCallsCounter = ApiCallsCounter.getInstance();

// Helper pour l'utilisation dans les composants React
export const useApiCallsStats = () => {
    return apiCallsCounter.getStats();
};


