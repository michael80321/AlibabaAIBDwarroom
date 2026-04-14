import { prisma } from './prisma';
import { sendCriticalAlert, sendWarningAlert, sendResolvedAlert } from './telegram';

interface VendorStatusResult {
  vendor: string;
  status: 'operational' | 'degraded' | 'outage';
  incident?: string;
  affected_services: string[];
}

async function fetchAWSStatus(): Promise<VendorStatusResult> {
  try {
    const res = await fetch('https://status.aws.amazon.com/data.json', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { current: Array<{ status: number; service_name: string; summary: string }> };

    const issues = data.current?.filter((item) => item.status > 0) || [];
    if (issues.length === 0) return { vendor: 'AWS', status: 'operational', affected_services: [] };

    const hasOutage = issues.some((i) => i.status >= 2);
    return {
      vendor: 'AWS',
      status: hasOutage ? 'outage' : 'degraded',
      incident: issues[0]?.summary || 'Service issue detected',
      affected_services: issues.map((i) => i.service_name),
    };
  } catch {
    return { vendor: 'AWS', status: 'operational', affected_services: [] };
  }
}

async function fetchGCPStatus(): Promise<VendorStatusResult> {
  try {
    const res = await fetch('https://status.cloud.google.com/incidents.json', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as Array<{ end?: string; severity: string; external_desc: string; affected_products: Array<{ title: string }> }>;

    const activeIncidents = data.filter((i) => !i.end);
    if (activeIncidents.length === 0) return { vendor: 'GCP', status: 'operational', affected_services: [] };

    const hasHigh = activeIncidents.some((i) => i.severity === 'high');
    return {
      vendor: 'GCP',
      status: hasHigh ? 'outage' : 'degraded',
      incident: activeIncidents[0]?.external_desc || 'Service issue detected',
      affected_services: activeIncidents[0]?.affected_products?.map((p) => p.title) || [],
    };
  } catch {
    return { vendor: 'GCP', status: 'operational', affected_services: [] };
  }
}

async function fetchCloudflareStatus(): Promise<VendorStatusResult> {
  try {
    const res = await fetch('https://www.cloudflarestatus.com/api/v2/status.json', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { status: { indicator: string; description: string } };

    const indicator = data.status?.indicator || 'none';
    if (indicator === 'none') return { vendor: 'Cloudflare', status: 'operational', affected_services: [] };

    return {
      vendor: 'Cloudflare',
      status: indicator === 'critical' ? 'outage' : 'degraded',
      incident: data.status?.description,
      affected_services: [],
    };
  } catch {
    return { vendor: 'Cloudflare', status: 'operational', affected_services: [] };
  }
}

async function fetchAzureStatus(): Promise<VendorStatusResult> {
  try {
    const res = await fetch('https://azure.status.microsoft/api/v2/status.json', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { status: { indicator: string; description: string } };

    const indicator = data.status?.indicator || 'none';
    if (indicator === 'none') return { vendor: 'Azure', status: 'operational', affected_services: [] };

    return {
      vendor: 'Azure',
      status: indicator === 'critical' ? 'outage' : 'degraded',
      incident: data.status?.description,
      affected_services: [],
    };
  } catch {
    return { vendor: 'Azure', status: 'operational', affected_services: [] };
  }
}

async function fetchGenericStatus(vendor: string): Promise<VendorStatusResult> {
  // For vendors without a parseable API, return operational as default
  return { vendor, status: 'operational', affected_services: [] };
}

export async function checkAllVendorStatus(): Promise<void> {
  const results = await Promise.allSettled([
    fetchAWSStatus(),
    fetchGCPStatus(),
    fetchCloudflareStatus(),
    fetchAzureStatus(),
    fetchGenericStatus('Alibaba'),
    fetchGenericStatus('Tencent'),
    fetchGenericStatus('Oracle'),
    fetchGenericStatus('Huawei'),
  ]);

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const current = result.value;

    // Get previous status
    const previous = await prisma.serviceStatus.findFirst({
      where: { vendor: current.vendor },
      orderBy: { checked_at: 'desc' },
    });

    const previousStatus = previous?.status || 'operational';

    // Write new status record
    await prisma.serviceStatus.create({
      data: {
        vendor: current.vendor,
        status: current.status,
        previous_status: previousStatus,
        incident: current.incident,
        affected_services: current.affected_services,
        checked_at: new Date(),
      },
    });

    // Detect status degradation
    const isWorse =
      (previousStatus === 'operational' && (current.status === 'degraded' || current.status === 'outage')) ||
      (previousStatus === 'degraded' && current.status === 'outage');

    const isRecovered =
      (previousStatus === 'degraded' || previousStatus === 'outage') &&
      current.status === 'operational';

    if (isWorse) {
      const severity = current.status === 'outage' ? 'critical' : 'warning';

      // Create incident record
      const incident = await prisma.statusIncident.create({
        data: {
          vendor: current.vendor,
          severity,
          title: current.incident || `${current.vendor} service ${current.status}`,
          description: current.incident,
          affected_customers: [],
        },
      });

      // Find affected customers
      const affectedCustomers = await prisma.customer.findMany({
        where: { current_cloud: current.vendor },
      });

      const affectedIds = affectedCustomers.map((c) => c.id);

      // Update incident with affected customers
      await prisma.statusIncident.update({
        where: { id: incident.id },
        data: { affected_customers: affectedIds },
      });

      // Send alerts
      if (severity === 'critical') {
        await sendCriticalAlert(
          { ...incident, affected_customers: affectedIds },
          affectedCustomers
        );
      } else {
        await sendWarningAlert({ ...incident, affected_customers: affectedIds });
      }

      await prisma.statusIncident.update({
        where: { id: incident.id },
        data: { telegram_sent: true },
      });
    }

    if (isRecovered) {
      // Find the open incident
      const openIncident = await prisma.statusIncident.findFirst({
        where: { vendor: current.vendor, resolved_at: null },
        orderBy: { started_at: 'desc' },
      });

      if (openIncident) {
        const resolvedAt = new Date();
        const durationMinutes = Math.floor(
          (resolvedAt.getTime() - openIncident.started_at.getTime()) / (1000 * 60)
        );

        await prisma.statusIncident.update({
          where: { id: openIncident.id },
          data: { resolved_at: resolvedAt },
        });

        await sendResolvedAlert(
          { ...openIncident, resolved_at: resolvedAt },
          durationMinutes
        );
      }
    }
  }
}
