import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/clients
 * Creates a new client profile
 */
export async function createClient(req, res) {
  const { companyName, gstNumber, panNumber, address, contactPerson, phoneNumber, email } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: { message: 'Company name is required' } });
  }

  try {
    const client = await prisma.client.create({
      data: {
        companyName,
        gstNumber,
        panNumber,
        address,
        contactPerson,
        phoneNumber,
        email,
        createdBy: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Client Created',
        entityType: 'Client',
        entityId: client.id,
        description: `Created client ${companyName}`,
      },
    });

    return res.status(201).json({ message: 'Client created successfully', client });
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * GET /api/clients
 * List all active clients
 */
export async function getClients(req, res) {
  try {
    const clients = await prisma.client.findMany({
      where: { isActive: true },
      include: {
        contracts: { where: { isActive: true } },
      },
      orderBy: { companyName: 'asc' },
    });
    return res.json(clients);
  } catch (error) {
    console.error('Fetch clients error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * PUT /api/clients/:id
 * Update client profile details
 */
export async function updateClient(req, res) {
  const { id } = req.params;
  const { companyName, gstNumber, panNumber, address, contactPerson, phoneNumber, email } = req.body;

  try {
    const existing = await prisma.client.findFirst({ where: { id, isActive: true } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Client not found' } });
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        companyName,
        gstNumber,
        panNumber,
        address,
        contactPerson,
        phoneNumber,
        email,
        updatedBy: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Client Updated',
        entityType: 'Client',
        entityId: id,
        description: `Updated client details for ${companyName}`,
      },
    });

    return res.json({ message: 'Client updated successfully', client });
  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * DELETE /api/clients/:id (Soft Delete)
 * Deactivates client profile and its contracts
 */
export async function deactivateClient(req, res) {
  const { id } = req.params;

  try {
    const client = await prisma.client.findFirst({ where: { id, isActive: true } });
    if (!client) {
      return res.status(404).json({ error: { message: 'Client not found' } });
    }

    await prisma.$transaction(async (tx) => {
      // Deactivate client
      await tx.client.update({
        where: { id },
        data: { isActive: false, updatedBy: req.user.id },
      });

      // Deactivate client contracts
      await tx.contract.updateMany({
        where: { clientId: id },
        data: { isActive: false, status: 'TERMINATED', updatedBy: req.user.id },
      });

      // Log action
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'Client Deactivated',
          entityType: 'Client',
          entityId: id,
          description: `Deactivated client ${client.companyName} and terminated associated contracts`,
        },
      });
    });

    return res.json({ message: `Client ${client.companyName} deactivated successfully` });
  } catch (error) {
    console.error('Deactivate client error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * POST /api/contracts
 * Create a new contract under a client
 */
export async function createContract(req, res) {
  const {
    clientId, contractName, startDate, endDate,
    serviceChargePercentage, cgstPercentage = 9.0, sgstPercentage = 9.0,
    termsConditions, status = 'DRAFT'
  } = req.body;

  if (!clientId || !contractName || !startDate || !endDate || serviceChargePercentage === undefined) {
    return res.status(400).json({ error: { message: 'Missing required contract parameters' } });
  }

  try {
    // Verify client exists and is active
    const client = await prisma.client.findFirst({ where: { id: clientId, isActive: true } });
    if (!client) {
      return res.status(404).json({ error: { message: 'Client not found or is inactive' } });
    }

    const contract = await prisma.contract.create({
      data: {
        clientId,
        contractName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        serviceChargePercentage: parseFloat(serviceChargePercentage),
        cgstPercentage: parseFloat(cgstPercentage),
        sgstPercentage: parseFloat(sgstPercentage),
        termsConditions,
        status,
        createdBy: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Contract Created',
        entityType: 'Contract',
        entityId: contract.id,
        description: `Created contract ${contractName} for client ${client.companyName}`,
      },
    });

    return res.status(201).json({ message: 'Contract created successfully', contract });
  } catch (error) {
    console.error('Create contract error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * GET /api/contracts
 * List all active contracts
 */
export async function getContracts(req, res) {
  try {
    const contracts = await prisma.contract.findMany({
      where: { isActive: true },
      include: {
        client: { select: { id: true, companyName: true } },
      },
      orderBy: { contractName: 'asc' },
    });
    return res.json(contracts);
  } catch (error) {
    console.error('Fetch contracts error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

/**
 * PUT /api/contracts/:id/status
 * Update contract status (e.g. DRAFT -> ACTIVE)
 */
export async function updateContractStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: { message: `Invalid status. Allowed values: ${validStatuses.join(', ')}` } });
  }

  try {
    const contract = await prisma.contract.findFirst({ where: { id, isActive: true } });
    if (!contract) {
      return res.status(404).json({ error: { message: 'Contract not found' } });
    }

    await prisma.contract.update({
      where: { id },
      data: { status, updatedBy: req.user.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Contract Status Updated',
        entityType: 'Contract',
        entityId: id,
        description: `Updated status of contract ${contract.contractName} to ${status}`,
      },
    });

    return res.json({ message: `Contract status updated to ${status}` });
  } catch (error) {
    console.error('Update contract status error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
