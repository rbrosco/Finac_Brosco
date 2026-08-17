import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import {
  createEvolutionInstance,
  fetchEvolutionQRCode,
  getEvolutionInstanceStatus,
  logoutEvolutionInstance,
  restartEvolutionInstance,
  deleteEvolutionInstance,
  fetchEvolutionInstances
} from "@/lib/services/evolution";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { action, evolution_api_url, evolution_api_key, evolution_instance_name } = body;

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);

    let config = await configRepo.findOne({ where: { user_id: user.id } });
    if (!config) {
      config = configRepo.create({ user_id: user.id });
    }

    const effectiveConfig: Partial<IntegrationConfig> = {
      ...config,
      evolution_api_url: evolution_api_url ? evolution_api_url.trim() : config.evolution_api_url,
      evolution_api_key: evolution_api_key ? evolution_api_key.trim() : config.evolution_api_key,
      evolution_instance_name: evolution_instance_name ? evolution_instance_name.trim() : (config.evolution_instance_name || "finac_instance"),
    };

    // Save updated instance name / keys if provided
    config.evolution_api_url = effectiveConfig.evolution_api_url!;
    config.evolution_api_key = effectiveConfig.evolution_api_key!;
    config.evolution_instance_name = effectiveConfig.evolution_instance_name!;
    await configRepo.save(config);

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const webhookUrl = `${origin}/api/webhooks/evolution`;

    if (action === "create") {
      const createRes = await createEvolutionInstance(effectiveConfig, webhookUrl);
      return NextResponse.json({
        success: true,
        message: `Instância '${effectiveConfig.evolution_instance_name}' criada com sucesso no servidor Evolution API!`,
        result: createRes
      });
    }

    if (action === "restart") {
      const restartRes = await restartEvolutionInstance(effectiveConfig);
      return NextResponse.json({
        success: true,
        message: `Instância '${effectiveConfig.evolution_instance_name}' reiniciada.`,
        result: restartRes
      });
    }

    if (action === "delete") {
      const deleteRes = await deleteEvolutionInstance(effectiveConfig);
      return NextResponse.json({
        success: true,
        message: `Instância '${effectiveConfig.evolution_instance_name}' excluída do servidor Evolution API.`,
        result: deleteRes
      });
    }

    // Default: Ensure instance exists & Fetch QR Code
    await createEvolutionInstance(effectiveConfig, webhookUrl);
    const qrResult = await fetchEvolutionQRCode(effectiveConfig);

    return NextResponse.json({
      success: true,
      instanceName: effectiveConfig.evolution_instance_name,
      qrCodeUrl: qrResult.base64,
      pairingCode: qrResult.pairingCode,
    });
  } catch (error: any) {
    console.error("Evolution Instance Action Error:", error);
    return NextResponse.json({ error: error.message || "Erro de comunicação com Evolution API." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);
    let config = await configRepo.findOne({ where: { user_id: user.id } });

    if (!config) {
      config = configRepo.create({ user_id: user.id });
    }

    const [statusResult, allInstances] = await Promise.all([
      getEvolutionInstanceStatus(config),
      fetchEvolutionInstances(config)
    ]);

    let finalState = statusResult.state;
    let finalInstanceName = config.evolution_instance_name;

    // Autonomous Auto-Discovery: If current config is disconnected, check if server has an active instance (e.g. "Rogger")
    if (finalState === "disconnected" && allInstances && allInstances.length > 0) {
      // Find an instance on server
      const foundInst = allInstances.find((inst: any) => {
        const state = inst.connectionStatus || inst.state || inst.instance?.state;
        return state === "open" || state === "connecting";
      }) || allInstances[0];

      if (foundInst) {
        const foundName = typeof foundInst === "string" ? foundInst : (foundInst.name || foundInst.instanceName || foundInst.instance?.instanceName || foundInst.instance?.name);
        if (foundName && foundName !== config.evolution_instance_name) {
          config.evolution_instance_name = foundName;
          await configRepo.save(config);
          finalInstanceName = foundName;
          const recheck = await getEvolutionInstanceStatus(config);
          finalState = recheck.state;
        }
      }
    }

    return NextResponse.json({
      state: finalState,
      instanceName: finalInstanceName,
      whatsappNumber: config.whatsapp_number,
      instances: allInstances
    });
  } catch (error: any) {
    return NextResponse.json({ state: "disconnected", error: error.message, instances: [] });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);
    const config = await configRepo.findOne({ where: { user_id: user.id } });

    if (config) {
      await logoutEvolutionInstance(config);
    }

    return NextResponse.json({ success: true, message: "Desconectado da Evolution API" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao desconectar" }, { status: 500 });
  }
}
