import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/settings
 * Retrieves company settings parameters
 */
export async function getSettings(req, res) {
  try {
    let settings = await prisma.setting.findFirst();
    
    // Fallback: seed default settings if missing
    if (!settings) {
      const defaultSlabs = [
        { maxGross: 15000, pt: 0 },
        { maxGross: 20000, pt: 150 },
        { maxGross: 9999999, pt: 200 },
      ];

      settings = await prisma.setting.create({
        data: {
          companyName: 'Elite Staffing Solutions',
          companyLogoUrl: '',
          address: '123 Business Hub, Tech City, 560001',
          phoneNumber: '+91 98765 43210',
          email: 'info@elitestaffing.com',
          gstNumber: '29AAAAA0000A1Z5',
          panNumber: 'AAAAA0000A',
          defaultPfPercentage: 12.0,
          defaultPfAdminPercentage: 1.0,
          defaultEsicPercentage: 3.25,
          professionalTaxSlabsJson: JSON.stringify(defaultSlabs),
          maximumOtHoursPerDay: 8.0,
        },
      });
    }

    // Parse slabs JSON for frontend ease of use
    const parsedSettings = {
      ...settings,
      professionalTaxSlabs: JSON.parse(settings.professionalTaxSlabsJson || '[]'),
    };
    delete parsedSettings.professionalTaxSlabsJson;

    return res.json(parsedSettings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ error: { message: 'Internal server error fetching settings' } });
  }
}

/**
 * PUT /api/settings
 * Update settings details (Admin Only)
 */
export async function updateSettings(req, res) {
  const {
    companyName, companyLogoUrl, address, phoneNumber, email,
    gstNumber, panNumber, defaultPfPercentage, defaultPfAdminPercentage,
    defaultEsicPercentage, professionalTaxSlabs, maximumOtHoursPerDay
  } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: { message: 'Company name is required' } });
  }

  try {
    let existing = await prisma.setting.findFirst();

    const updateData = {
      companyName,
      companyLogoUrl,
      address,
      phoneNumber,
      email,
      gstNumber,
      panNumber,
      defaultPfPercentage: defaultPfPercentage !== undefined ? parseFloat(defaultPfPercentage) : undefined,
      defaultPfAdminPercentage: defaultPfAdminPercentage !== undefined ? parseFloat(defaultPfAdminPercentage) : undefined,
      defaultEsicPercentage: defaultEsicPercentage !== undefined ? parseFloat(defaultEsicPercentage) : undefined,
      maximumOtHoursPerDay: maximumOtHoursPerDay !== undefined ? parseFloat(maximumOtHoursPerDay) : undefined,
      updatedBy: req.user.id,
    };

    if (professionalTaxSlabs && Array.isArray(professionalTaxSlabs)) {
      updateData.professionalTaxSlabsJson = JSON.stringify(professionalTaxSlabs);
    }

    let settings;
    if (existing) {
      settings = await prisma.setting.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      settings = await prisma.setting.create({
        data: {
          ...updateData,
          professionalTaxSlabsJson: JSON.stringify(professionalTaxSlabs || []),
        },
      });
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'Settings Updated',
        entityType: 'Setting',
        entityId: settings.id,
        description: `Company settings and tax configuration updated by Admin`,
      },
    });

    const responseData = {
      ...settings,
      professionalTaxSlabs: JSON.parse(settings.professionalTaxSlabsJson || '[]'),
    };
    delete responseData.professionalTaxSlabsJson;

    return res.json({ message: 'Settings updated successfully', settings: responseData });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: { message: 'Internal server error updating settings' } });
  }
}
