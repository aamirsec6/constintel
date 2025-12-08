// Quick script to fix profiles with empty identifiers
import { getPrismaClient } from '../db/prismaClient';

const prisma = getPrismaClient();
const BRAND_ID = 'test-brand';

async function fixProfiles() {
  console.log('🔧 Fixing profiles with empty identifiers...');
  
  const profiles = await prisma.customerProfile.findMany({
    where: { 
      brandId: BRAND_ID,
    },
    take: 200
  });
  
  console.log(`Found ${profiles.length} profiles to check`);
  
  let updated = 0;
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const identifiers = profile.identifiers as any;
    
    // Check if identifiers are empty or missing
    if (!identifiers || Object.keys(identifiers).length === 0) {
      const email = `customer${i}@example.com`;
      const phone = `+1-555-${String(1000 + i).padStart(4, '0')}`;
      const loyaltyId = `LOY-${String(100000 + i).padStart(6, '0')}`;
      
      await prisma.customerProfile.update({
        where: { id: profile.id },
        data: {
          identifiers: { email, phone, loyalty_id: loyaltyId },
          profileStrength: 40 + Math.floor(Math.random() * 55)
        }
      });
      
      updated++;
      if (updated % 25 === 0) {
        console.log(`   ✅ Updated ${updated} profiles...`);
      }
    }
  }
  
  console.log(`✅ Updated ${updated} profiles with identifiers`);
  await prisma.$disconnect();
}

fixProfiles().catch(console.error);

