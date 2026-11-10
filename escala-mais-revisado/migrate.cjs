/* Run only after reviewing TRANSICAO.md. Defaults to a read-only dry run. */
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
const project=arg('--project'),churchId=arg('--church'),apply=args.includes('--apply');
if(!project||!churchId||!args.includes('--project')||!args.includes('--church'))throw Error('Use --project PROJECT --church ID [--apply --backup-uri gs://...]');
if(apply&&!process.env.FIRESTORE_EMULATOR_HOST&&(!args.includes('--backup-uri')||!arg('--backup-uri').startsWith('gs://')))throw Error('A reviewed, completed export backup is required. Supply --backup-uri.');
initializeApp({projectId:project,...(!process.env.FIRESTORE_EMULATOR_HOST?{credential:applicationDefault()}:{})});
const db=getFirestore(),ref=db.doc('igs/'+churchId);
const publicData=(u,x)=>({u,n:x.n||'',foto:x.foto||'',nasc:x.nasc||''});
(async()=>{
 const result=await db.runTransaction(async t=>{
  const snap=await t.get(ref);if(!snap.exists)throw Error('Church missing');const g=snap.data();
  const known=['schema','n','code','adm','ids','mb','mins','cfg','ind','indr','nt','av','po'];if(Object.keys(g).some(k=>!known.includes(k)))throw Error('Unknown church fields; review before migration');
  const requests=await t.get(ref.collection('pedidos'));
  const legacy=g.mb||[];if(g.schema===2&&legacy.length)throw Error('Unexpected mixed schema');
  const people=new Map(legacy.map(x=>[x.u,x]));for(const d of requests.docs)if(!people.has(d.id))people.set(d.id,d.data());
  const source=[];let conflicts=0;
  for(const x of people.values()){if(Object.keys(x).some(k=>!['u','n','tel','foto','nasc'].includes(k)))throw Error('Unknown profile/request fields; review before migration');if(typeof x.n!=='string'||x.n.length>120||(x.foto||'').length>40000)throw Error('Public profile exceeds the new schema; review before migration')}
  for(const [u,x] of people){const profile=await t.get(db.doc('users/'+u));const contact=await t.get(ref.collection('contatos').doc(u));
   const p=profile.exists?profile.data():{};if(p.tel&&x.tel&&p.tel!==x.tel)conflicts++;
   const tel=p.tel||x.tel||contact.data()?.tel||'';if(typeof tel!=='string'||tel.length>32)throw Error('Phone exceeds the new schema; review before migration');source.push({u,x,p,contact,tel});}
  const writes=1+legacy.length+source.filter(x=>x.tel).length+requests.size;
  if(writes>450)throw Error('Too many writes for one atomic migration; prepare a staged migration under maintenance.');
  if(legacy.some(x=>!g.ids.includes(x.u))||g.ids.some(u=>!people.has(u))&&g.schema!==2)throw Error('Membership inconsistencies; resolve before applying');
  if(apply){
   for(const x of source){if(legacy.some(y=>y.u===x.u))t.set(ref.collection('membros').doc(x.u),publicData(x.u,x.x));
    if(x.tel)t.set(ref.collection('contatos').doc(x.u),{tel:x.tel});}
   for(const d of requests.docs)t.set(d.ref,publicData(d.id,d.data()));
   const next={...g,schema:2};delete next.mb;t.set(ref,next);
  }
  return {apply,church:churchId,publicMembers:legacy.length,requests:requests.size,contacts:source.filter(x=>x.tel).length,conflictsResolvedUsingPrivateUserProfile:conflicts,writes};
 });console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1});
