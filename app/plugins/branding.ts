/**
 * Logo and header wing from the CMS (Impostazioni → Logo e immagini del
 * sito). Read once on the server for each page and handed to the browser,
 * so every picture is right from the first paint. Empty fields keep the
 * built-in files.
 */
export type Branding = { logo: string; particle_logo: string; header_wing: string };

export default defineNuxtPlugin(async () => {
    const branding = useState<Branding | null>("branding", () => null);

    if (import.meta.server && branding.value === null) {
        const base = String(useRuntimeConfig().apiInternalBase || "").replace(/\/$/, "");
        branding.value = await $fetch<Branding>(`${base}/branding/`, { timeout: 3000 }).catch(() => ({
            logo: "",
            particle_logo: "",
            header_wing: "",
        }));
    }

    setImageOverrides({
        "Axatel.svg": branding.value?.particle_logo,
        "ala.png": branding.value?.header_wing,
    });
});
