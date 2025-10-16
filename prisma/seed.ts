import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库初始化...');

  // 创建默认管理员账号
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nextchat.com' },
    update: {},
    create: {
      email: 'admin@nextchat.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ 创建管理员账号:', {
    email: admin.email,
    username: admin.username,
    defaultPassword: 'admin123',
  });

  // 创建默认系统配置
  await prisma.systemConfig.upsert({
    where: { key: 'ALLOW_REGISTER' },
    update: {},
    create: {
      key: 'ALLOW_REGISTER',
      value: 'true',
      description: '是否允许用户注册',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'DEFAULT_MODEL' },
    update: {},
    create: {
      key: 'DEFAULT_MODEL',
      value: 'gpt-3.5-turbo',
      description: '默认使用的模型',
    },
  });

  console.log('✅ 创建系统配置完成');
  console.log('\n🎉 数据库初始化完成！');
  console.log('\n📝 默认管理员账号:');
  console.log('   邮箱: admin@nextchat.com');
  console.log('   密码: admin123');
  console.log('   ⚠️  请在首次登录后立即修改密码！\n');
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

