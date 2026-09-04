import 'dotenv/config'
import { prisma } from './src/lib/prisma'
async function main() {
  const s = await prisma.session.findUnique({ where: { id: 'cmtmzok5t017zzwot57uzz5jk' }, select: { name: true, speakers: true } })
  console.log(JSON.stringify(s, null, 2))
}
main().finally(() => prisma.$disconnect())
