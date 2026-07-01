import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 操作员
  await prisma.operator.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, userid: '1', username: 'admin', pwd: '123456', usertype: 'admin' },
  });
  await prisma.operator.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, userid: '2', username: 'experimenter', pwd: '123456', usertype: 'operator' },
  });

  // 设备
  const now = new Date();
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  await prisma.apparatus.upsert({
    where: { apparatusid: 0 },
    update: {},
    create: {
      apparatusid: 0,
      innernumber: 'FURNACE-01',
      apparatusname: '一号试验炉',
      checkdatef: now,
      checkdatet: oneYearLater,
      pidport: 'COM9',
      powerport: 'COM9',
      constpower: 2048,
    },
  });

  // 传感器 (5个业务通道)
  const sensors = [
    { sensorid: 0, sensorname: 'Sensor0', dispname: '炉温1', sensorgroup: '采集', unit: '℃', discription: '炉温1', flag: '启用' },
    { sensorid: 1, sensorname: 'Sensor1', dispname: '炉温2', sensorgroup: '采集', unit: '℃', discription: '炉温2', flag: '启用' },
    { sensorid: 2, sensorname: 'Sensor2', dispname: '表面温度', sensorgroup: '采集', unit: '℃', discription: '表面温度', flag: '启用' },
    { sensorid: 3, sensorname: 'Sensor3', dispname: '中心温度', sensorgroup: '采集', unit: '℃', discription: '中心温度', flag: '启用' },
    { sensorid: 16, sensorname: 'Sensor16', dispname: '校准温度', sensorgroup: '校准', unit: '℃', discription: '校准温度', flag: '启用' },
  ];

  for (const s of sensors) {
    await prisma.sensor.upsert({
      where: { sensorid: s.sensorid },
      update: {},
      create: s,
    });
  }

  // 备用通道 4~15
  for (let i = 4; i <= 15; i++) {
    await prisma.sensor.upsert({
      where: { sensorid: i },
      update: {},
      create: {
        sensorid: i,
        sensorname: `Sensor${i}`,
        dispname: `备用通道${i + 1}`,
        sensorgroup: '备用',
        unit: '℃',
        discription: '备用通道',
        flag: '启用',
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
