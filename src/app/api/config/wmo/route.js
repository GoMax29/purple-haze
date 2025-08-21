import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    console.log("🔥 [API Config WMO] Lecture de la configuration...");

    const configPath = path.join(process.cwd(), "config", "wmo.json");

    if (!fs.existsSync(configPath)) {
      throw new Error(`Fichier de configuration non trouvé: ${configPath}`);
    }

    const configData = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configData);

    console.log(
      `🔥 [API Config WMO] Configuration chargée - Algorithme: ${config.algorithm}`
    );

    return NextResponse.json({
      success: true,
      data: config,
      metadata: {
        algorithm: config.algorithm,
        enabled_models: Object.entries(config.models)
          .filter(([key, model]) => model.enabled)
          .map(([key, model]) => ({ key, name: model.name })),
        total_models: Object.keys(config.models).length,
      },
    });
  } catch (error) {
    console.error("❌ [API Config WMO] Erreur:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
