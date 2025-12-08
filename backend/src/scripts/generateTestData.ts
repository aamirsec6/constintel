// GENERATOR: SANDBOX
// ASSUMPTIONS: Prisma client, database connected, DATABASE_URL in env
// HOW TO RUN: npm run seed or tsx src/scripts/generateTestData.ts

import { getPrismaClient } from '../db/prismaClient';
import { ingestEvent } from '../services/ingestion/eventIngestion';

const prisma = getPrismaClient();

const BRAND_ID = process.env.TEST_BRAND_ID || 'test-brand';

// Sample data generators - Expanded for 10k profiles
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel', 'Deborah',
  'Matthew', 'Stephanie', 'Anthony', 'Rebecca', 'Mark', 'Sharon', 'Donald', 'Laura',
  'Steven', 'Michelle', 'Paul', 'Kimberly', 'Andrew', 'Angela', 'Joshua', 'Amy',
  'Kenneth', 'Nicole', 'Kevin', 'Elizabeth', 'Brian', 'Helen', 'George', 'Sandra',
  'Timothy', 'Donna', 'Ronald', 'Carol', 'Jason', 'Ruth', 'Edward', 'Sharon',
  'Jeffrey', 'Michelle', 'Ryan', 'Laura', 'Jacob', 'Sarah', 'Gary', 'Kimberly',
  'Nicholas', 'Deborah', 'Eric', 'Lisa', 'Jonathan', 'Nancy', 'Stephen', 'Karen',
  'Larry', 'Betty', 'Justin', 'Helen', 'Scott', 'Sandra', 'Brandon', 'Donna',
  'Benjamin', 'Carol', 'Samuel', 'Ruth', 'Frank', 'Sharon', 'Gregory', 'Michelle',
  'Raymond', 'Laura', 'Alexander', 'Sarah', 'Patrick', 'Kimberly', 'Jack', 'Deborah',
  'Dennis', 'Lisa', 'Jerry', 'Nancy', 'Tyler', 'Karen', 'Aaron', 'Betty',
  'Jose', 'Helen', 'Adam', 'Sandra', 'Nathan', 'Donna', 'Henry', 'Carol',
  'Douglas', 'Ruth', 'Zachary', 'Sharon', 'Peter', 'Michelle', 'Kyle', 'Laura',
  'Noah', 'Sarah', 'Ethan', 'Kimberly', 'Jeremy', 'Deborah', 'Walter', 'Lisa',
  'Christian', 'Nancy', 'Keith', 'Karen', 'Roger', 'Betty', 'Terry', 'Helen',
  'Gerald', 'Sandra', 'Harold', 'Donna', 'Sean', 'Carol', 'Austin', 'Ruth',
  'Carl', 'Sharon', 'Arthur', 'Michelle', 'Lawrence', 'Laura', 'Dylan', 'Sarah',
  'Jesse', 'Kimberly', 'Jordan', 'Deborah', 'Bryan', 'Lisa', 'Billy', 'Nancy',
  'Bruce', 'Karen', 'Gabriel', 'Betty', 'Joe', 'Helen', 'Alan', 'Sandra',
  'Juan', 'Donna', 'Wayne', 'Carol', 'Roy', 'Ruth', 'Ralph', 'Sharon',
  'Randy', 'Michelle', 'Eugene', 'Laura', 'Vincent', 'Sarah', 'Russell', 'Kimberly',
  'Louis', 'Deborah', 'Philip', 'Lisa', 'Bobby', 'Nancy', 'Johnny', 'Karen',
  'Willie', 'Betty'
];
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
  'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
  'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
  'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
  'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross',
  'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell',
  'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Vasquez', 'Simmons',
  'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds', 'Griffin',
  'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson',
  'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro',
  'Marshall', 'Owens', 'Harrison', 'Fernandez', 'Mcdonald', 'Woods', 'Washington', 'Kennedy',
  'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb', 'Tucker', 'Guzman',
  'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon', 'Mendez',
  'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks',
  'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone',
  'Salazar', 'Fox', 'Warren', 'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza',
  'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Weaver', 'Ryan', 'Gardner',
  'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins', 'Arnold', 'Pierce',
  'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley', 'Knight', 'Elliott',
  'Cunningham', 'Duncan', 'Armstrong', 'Hudson', 'Carroll', 'Lane', 'Riley', 'Andrews',
  'Alvarado', 'Ray', 'Delgado', 'Berry', 'Perkins', 'Hoffman', 'Johnston', 'Matthews',
  'Pena', 'Richards', 'Contreras', 'Willis', 'Carpenter', 'Lawrence', 'Sandoval', 'Guerrero',
  'George', 'Chapman', 'Rios', 'Estrada', 'Ortega', 'Watkins', 'Greene', 'Nunez',
  'Wheeler', 'Valdez', 'Harper', 'Lynch', 'Mcdaniel', 'Garrett', 'Burton', 'Fuller',
  'Swanson', 'Lucas', 'Mullins', 'Brock', 'Ballard', 'Todd', 'Blair', 'Higgins',
  'Ingram', 'Reese', 'Cannon', 'Strickland', 'Townsend', 'Potter', 'Goodwin', 'Walton',
  'Rowe', 'Hampton', 'Ortega', 'Patton', 'Swanson', 'Joseph', 'Franklin', 'Lynch',
  'Bishop', 'Carr', 'Salinas', 'Bryant', 'Cordova', 'Floyd', 'Pace', 'Gonzalez',
  'Chandler', 'Mckinney', 'Dodson', 'Barrera', 'Mccarthy', 'Mccormick', 'Lyons', 'Horton',
  'Dennis', 'Mcgee', 'Buchanan', 'Strickland', 'Doyle', 'Mccarty', 'Vaughn', 'Roth',
  'Maynard', 'Lowery', 'Durham', 'Landry', 'Duke', 'Oconnor', 'Huynh', 'Bauer',
  'Avery', 'Spears', 'Conway', 'Preston', 'Compton', 'Berg', 'Wiggins', 'Nash',
  'Singleton', 'Kirk', 'Combs', 'Mathis', 'Christian', 'Skinner', 'Bradford', 'Richard',
  'Galvan', 'Wall', 'Boone', 'Kirby', 'Wilkinson', 'Middleton', 'Farrell', 'Schneider',
  'Gill', 'Farmer', 'Hobbs', 'Bond', 'Tyler', 'Barr', 'Bowers', 'House',
  'Mcintosh', 'Hoover', 'Pennington', 'Bernard', 'Garner', 'Mcgrath', 'Montgomery', 'Frost',
  'Mccall', 'Carey', 'Bridges', 'Schroeder', 'Pate', 'Briggs', 'Pruitt', 'Henson',
  'Hull', 'Huerta', 'Baxter', 'Cervantes', 'Krause', 'Bender', 'Maddox', 'Mccann',
  'Hahn', 'Coffey', 'Benton', 'Cantrell', 'Mccullough', 'Brennan', 'Mccormick', 'Mccarthy',
  'Mccall', 'Mccann', 'Mccormick', 'Mccarthy', 'Mccullough', 'Mccann', 'Mccormick', 'Mccarthy'
];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com', 'company.com', 'icloud.com', 'protonmail.com'];
const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys', 'Food', 'Beauty', 'Automotive', 'Health', 'Garden', 'Music'];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generatePhone(): string {
  return `1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domain = randomElement(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateLoyaltyId(): string {
  return `LOY${randomInt(10000, 99999)}`;
}

function generateDeviceId(): string {
  return `DEV${randomInt(100000, 999999)}`;
}

function generateCookieId(): string {
  return `cookie_${randomInt(1000000, 9999999)}`;
}

async function generateCustomerProfiles(count: number, batchSize: number = 100) {
  console.log(`Generating ${count} customer profiles (batch size: ${batchSize})...`);

  const profiles: (string | null)[] = [];
  const batches = Math.ceil(count / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, count);
    const batchCount = batchEnd - batchStart;
    
    console.log(`  Processing batch ${batch + 1}/${batches} (${batchStart + 1}-${batchEnd})...`);
    
    // Generate batch in parallel
    const batchPromises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const phone = generatePhone();
      const email = generateEmail(firstName, lastName);
      const loyaltyId = Math.random() > 0.6 ? generateLoyaltyId() : undefined;
      const deviceId = Math.random() > 0.4 ? generateDeviceId() : undefined;
      const cookieId = Math.random() > 0.3 ? generateCookieId() : undefined;

      const identifiers: any = {
        phone,
        email,
      };
      if (loyaltyId) identifiers.loyalty_id = loyaltyId;
      if (deviceId) identifiers.device_id = deviceId;
      if (cookieId) identifiers.cookie_id = cookieId;

      batchPromises.push(
        ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            phone,
            email,
            loyalty_id: loyaltyId,
            device_id: deviceId,
            cookie_id: cookieId,
          },
        })
          .then(result => result.profileId)
          .catch(error => {
            console.error(`Error creating profile ${i + 1}:`, error);
            return null;
          })
      );
    }

    const batchResults = await Promise.all(batchPromises);
    profiles.push(...batchResults);
    
    console.log(`  ✅ Batch ${batch + 1} complete: ${batchResults.filter(p => p !== null).length}/${batchCount} profiles created`);
  }

  const successfulProfiles = profiles.filter(p => p !== null) as string[];
  console.log(`✅ Generated ${successfulProfiles.length}/${count} customer profiles`);
  return successfulProfiles;
}

async function generatePurchaseEvents(profileIds: string[], eventsPerProfile: number = 3, batchSize: number = 50) {
  console.log(`Generating purchase events (${eventsPerProfile} per profile, batch size: ${batchSize})...`);

  let totalEvents = 0;
  const totalBatches = Math.ceil(profileIds.length / batchSize);
  let currentBatch = 0;

  // Create product pool for more realistic recommendations
  const productPool: string[] = [];
  for (let i = 1000; i < 10000; i++) {
    productPool.push(`PROD${i}`);
  }

  for (let batchStart = 0; batchStart < profileIds.length; batchStart += batchSize) {
    currentBatch++;
    const batchEnd = Math.min(batchStart + batchSize, profileIds.length);
    const batchProfileIds = profileIds.slice(batchStart, batchEnd);
    
    console.log(`  Processing purchase batch ${currentBatch}/${totalBatches} (profiles ${batchStart + 1}-${batchEnd})...`);

    const batchPromises: Promise<void>[] = [];
    
    for (const profileId of batchProfileIds) {
      // Vary events per profile for realism (some customers buy more, some less)
      const profileEventCount = Math.random() > 0.3 
        ? eventsPerProfile 
        : randomInt(1, eventsPerProfile);
      
      for (let i = 0; i < profileEventCount; i++) {
        const daysAgo = randomInt(0, 180); // Extended to 6 months
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        const itemCount = randomInt(1, 5);
        const items = [];
        let total = 0;

        for (let j = 0; j < itemCount; j++) {
          const price = randomFloat(10, 500); // Wider price range
          const quantity = randomInt(1, 3);
          const itemTotal = price * quantity;
          total += itemTotal;

          // Use product pool for better recommendation training
          const productId = randomElement(productPool);

          items.push({
            product_id: productId,
            name: `${randomElement(categories)} Product ${productId.slice(-4)}`,
            category: randomElement(categories),
            quantity,
            price,
            total: itemTotal,
          });
        }

        batchPromises.push(
          ingestEvent({
            brandId: BRAND_ID,
            eventType: 'purchase',
            payload: {
              order_id: `ORD${randomInt(100000, 999999)}`,
              total,
              items,
              payment_method: randomElement(['card', 'cash', 'paypal', 'apple_pay', 'google_pay']),
              timestamp: createdAt.toISOString(),
            },
          })
            .then(() => { totalEvents++; })
            .catch(error => {
              console.error(`Error creating purchase event:`, error);
            })
        );
      }
    }

    await Promise.all(batchPromises);
    console.log(`  ✅ Batch ${currentBatch} complete: ${totalEvents} total events so far`);
  }

  console.log(`✅ Generated ${totalEvents} purchase events`);
}

async function generatePageViewEvents(profileIds: string[], eventsPerProfile: number = 10, batchSize: number = 100) {
  console.log(`Generating page view events (${eventsPerProfile} per profile, batch size: ${batchSize})...`);

  let totalEvents = 0;
  const totalBatches = Math.ceil(profileIds.length / batchSize);
  let currentBatch = 0;

  for (let batchStart = 0; batchStart < profileIds.length; batchStart += batchSize) {
    currentBatch++;
    const batchEnd = Math.min(batchStart + batchSize, profileIds.length);
    const batchProfileIds = profileIds.slice(batchStart, batchEnd);
    
    console.log(`  Processing page view batch ${currentBatch}/${totalBatches} (profiles ${batchStart + 1}-${batchEnd})...`);

    const batchPromises: Promise<void>[] = [];
    
    for (const profileId of batchProfileIds) {
      // Vary events per profile (some browse more)
      const profileEventCount = Math.random() > 0.5 
        ? eventsPerProfile 
        : randomInt(1, eventsPerProfile * 2);
      
      for (let i = 0; i < profileEventCount; i++) {
        const daysAgo = randomInt(0, 60); // Extended to 2 months
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        batchPromises.push(
          ingestEvent({
            brandId: BRAND_ID,
            eventType: 'page_view',
            payload: {
              page_url: `https://example.com/${randomElement(['products', 'category', 'home', 'cart', 'checkout', 'product-detail'])}`,
              page_title: `${randomElement(categories)} Page`,
              category: randomElement(categories),
              timestamp: createdAt.toISOString(),
            },
          })
            .then(() => { totalEvents++; })
            .catch(error => {
              console.error(`Error creating page view event:`, error);
            })
        );
      }
    }

    await Promise.all(batchPromises);
    console.log(`  ✅ Batch ${currentBatch} complete: ${totalEvents} total events so far`);
  }

  console.log(`✅ Generated ${totalEvents} page view events`);
}

async function generateWhatsAppEvents(profileIds: string[], batchSize: number = 100) {
  console.log(`Generating WhatsApp events (30% of customers, batch size: ${batchSize})...`);

  const messages = [
    'Hello, I want to place an order',
    'What products do you have?',
    'I need help with my order',
    'When will my order arrive?',
    'Can I return this item?',
    'Do you have this in stock?',
    'What is the shipping time?',
    'Can I track my order?',
    'I have a question about my purchase',
    'Thank you for your help',
  ];

  // Only 30% of customers send WhatsApp messages
  const whatsappProfileIds = profileIds.filter(() => Math.random() < 0.3);
  console.log(`  ${whatsappProfileIds.length} customers will send WhatsApp messages`);

  let totalEvents = 0;
  const totalBatches = Math.ceil(whatsappProfileIds.length / batchSize);
  let currentBatch = 0;

  for (let batchStart = 0; batchStart < whatsappProfileIds.length; batchStart += batchSize) {
    currentBatch++;
    const batchEnd = Math.min(batchStart + batchSize, whatsappProfileIds.length);
    const batchProfileIds = whatsappProfileIds.slice(batchStart, batchEnd);
    
    console.log(`  Processing WhatsApp batch ${currentBatch}/${totalBatches}...`);

    const batchPromises: Promise<void>[] = [];
    
    for (const profileId of batchProfileIds) {
      // 1-3 messages per customer
      const messageCount = randomInt(1, 3);
      
      for (let i = 0; i < messageCount; i++) {
        const daysAgo = randomInt(0, 30); // Extended to 1 month
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        batchPromises.push(
          ingestEvent({
            brandId: BRAND_ID,
            eventType: 'whatsapp_message',
            payload: {
              whatsapp: `+1${generatePhone()}`,
              message_body: randomElement(messages),
              timestamp: createdAt.toISOString(),
            },
          })
            .then(() => { totalEvents++; })
            .catch(error => {
              console.error(`Error creating WhatsApp event:`, error);
            })
        );
      }
    }

    await Promise.all(batchPromises);
    console.log(`  ✅ Batch ${currentBatch} complete: ${totalEvents} total events so far`);
  }

  console.log(`✅ Generated ${totalEvents} WhatsApp events`);
}

async function main() {
  const args = process.argv.slice(2);
  const customerCount = args[0] ? parseInt(args[0]) : 10000; // Default to 10k
  const purchasesPerCustomer = args[1] ? parseInt(args[1]) : 5; // More purchases for better ML training
  const pageViewsPerCustomer = args[2] ? parseInt(args[2]) : 15; // More page views

  console.log('🎲 Generating test data...');
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log(`Customers: ${customerCount}`);
  console.log(`Purchases per customer: ${purchasesPerCustomer} (varies)`);
  console.log(`Page views per customer: ${pageViewsPerCustomer} (varies)`);
  console.log('');
  
  const startTime = Date.now();

  try {
    // Generate customer profiles
    const profileIds = await generateCustomerProfiles(customerCount);
    console.log('');

    // Generate purchase events
    await generatePurchaseEvents(profileIds, purchasesPerCustomer);
    console.log('');

    // Generate page view events
    await generatePageViewEvents(profileIds, pageViewsPerCustomer);
    console.log('');

    // Generate WhatsApp events
    await generateWhatsAppEvents(profileIds);
    console.log('');

    // Summary
    const totalProfiles = await prisma.customerProfile.count({
      where: { brandId: BRAND_ID },
    });
    const totalEvents = await prisma.customerRawEvent.count({
      where: { brandId: BRAND_ID },
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('📊 Summary:');
    console.log(`  Total Profiles: ${totalProfiles}`);
    console.log(`  Total Events: ${totalEvents}`);
    console.log(`  Duration: ${duration} seconds`);
    console.log(`  Profiles/sec: ${(totalProfiles / parseFloat(duration)).toFixed(2)}`);
    console.log(`  Events/sec: ${(totalEvents / parseFloat(duration)).toFixed(2)}`);
    console.log('');
    console.log('✅ Test data generation complete!');
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

// Export functions for use in other scripts
export { generateCustomerProfiles, generatePurchaseEvents, generatePageViewEvents, generateWhatsAppEvents };

