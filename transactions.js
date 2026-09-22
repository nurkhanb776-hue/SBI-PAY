(function(){
  const getUserId=()=>{
    try{
      const profile=JSON.parse(localStorage.getItem('sbiPayProfile')||'null');
      return String(profile?.id || localStorage.getItem('sbiPayUserId') || '').trim();
    }catch(error){
      return String(localStorage.getItem('sbiPayUserId') || '').trim();
    }
  };
  const scopeKey=key=>{const userId=getUserId();return userId ? `sbiPayUser:${userId}:${key}` : `sbiPayGuest:${key}`;};
  const sessionStartedAt=Number(localStorage.getItem('sbiPaySessionStartedAt'));
  const sessionProfile=localStorage.getItem('sbiPayProfile');
  if(sessionProfile&&!Number.isFinite(sessionStartedAt))localStorage.setItem('sbiPaySessionStartedAt',String(Date.now()));
  if(sessionProfile&&Number.isFinite(sessionStartedAt)&&Date.now()-sessionStartedAt>=24*60*60*1000){
    ['sbiPayUsername','sbiPayProfile','sbiPayUserId','sbiPayInviteCode','sbiPaySessionStartedAt'].forEach(key=>localStorage.removeItem(key));
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith('sbiPayUser:')) localStorage.removeItem(key);
    }
    if(!/login\.html$/i.test(location.pathname))window.location.href='login.html';
    return;
  }
  document.addEventListener('click',event=>{if(event.target.closest('#confirm-logout')){['sbiPayUsername','sbiPayProfile','sbiPayUserId','sbiPayInviteCode','sbiPaySessionStartedAt'].forEach(key=>localStorage.removeItem(key));for (let index = localStorage.length - 1; index >= 0; index -= 1){const key=localStorage.key(index);if(key&&key.startsWith('sbiPayUser:'))localStorage.removeItem(key);}}});
  const storageKey=scopeKey('transactions');
  const seededTransactions=[
    {id:'receive-inr-185324',code:'X6GsNb',type:'INR',currency:'INR',label:'Receive INR',direction:'receive',amount:100,status:'success',date:'2026-09-15T18:35:21'},
    {id:'receive-inr-135819',code:'4kcXwN',type:'INR',currency:'INR',label:'Receive INR',direction:'receive',amount:200,status:'success',date:'2026-09-15T14:16:09'},
    {id:'receive-inr-135649',code:'Q2bxDU',type:'INR',currency:'INR',label:'Receive INR',direction:'receive',amount:300,status:'success',date:'2026-09-15T14:08:50'},
    {id:'receive-inr-134405',code:'mK7T8L',type:'INR',currency:'INR',label:'Receive INR',direction:'receive',amount:150,status:'success',date:'2026-09-15T14:06:25'},
    {id:'receive-inr-134041',code:'NAYzIP',type:'INR',currency:'INR',label:'Receive INR',direction:'receive',amount:200,status:'success',date:'2026-09-15T14:04:41'},
    {id:'receive-inr-133439',code:'bk7qrx',type:'INR',currency:'INR',label:'Receive INR',direction:'receive',amount:50,status:'success',date:'2026-09-15T14:04:39'},
    {id:'purchase-inr-185324',code:'K6rdUM',type:'INR',currency:'INR',label:'Purchase INR',direction:'purchase',amount:1000,status:'failed',date:'2026-09-15T18:53:24'},
    {id:'purchase-inr-135819',code:'b8tLqH',type:'INR',currency:'INR',label:'Purchase INR',direction:'purchase',amount:1000,status:'failed',date:'2026-09-15T13:58:19'},
    {id:'purchase-inr-135649',code:'b8tLqH',type:'INR',currency:'INR',label:'Purchase INR',direction:'purchase',amount:1000,status:'failed',date:'2026-09-15T13:56:49'},
    {id:'purchase-inr-134405',code:'y85qJP',type:'INR',currency:'INR',label:'Purchase INR',direction:'purchase',amount:500,status:'failed',date:'2026-09-15T13:17:08'},
    {id:'purchase-usdt-220000',code:'YA1pEI',type:'USDT',currency:'USDT',label:'Purchase USDT',direction:'purchase',amount:22000,status:'failed',date:'2026-09-16T15:56:30'},
    {id:'purchase-usdt-11000',code:'iY82mK',type:'USDT',currency:'USDT',label:'Purchase USDT',direction:'purchase',amount:11000,status:'failed',date:'2026-09-16T15:55:00'},
    {id:'purchase-usdt-5000',code:'qP4nV2',type:'USDT',currency:'USDT',label:'Purchase USDT',direction:'purchase',amount:5000,status:'failed',date:'2026-09-16T15:54:12'},
    {id:'receive-usdt-1200',code:'Z8fGvT',type:'USDT',currency:'USDT',label:'Receive USDT',direction:'receive',amount:1200,status:'success',date:'2026-09-16T16:12:00'},
    {id:'receive-usdt-450',code:'R9kU1s',type:'USDT',currency:'USDT',label:'Receive USDT',direction:'receive',amount:450,status:'success',date:'2026-09-16T08:45:18'}
  ];
  const normalizeTransaction=transaction=>{
    const direction=transaction.direction||(/receive|withdraw|deposit/i.test(transaction.label||'')?'receive':'purchase');
    const currency=transaction.currency||transaction.type||'INR';
    return {...transaction,direction,type:transaction.type||currency,currency,amount:Number(transaction.amount||0)};
  };
  const demoTransactionIds=new Set(seededTransactions.map(transaction=>transaction.id));
  const read=()=>{
    try{
      const stored=JSON.parse(localStorage.getItem(storageKey)||'null');
      const clean=Array.isArray(stored) ? stored.filter(transaction=>!demoTransactionIds.has(transaction.id)).map(normalizeTransaction) : [];
      try{
        const profile=JSON.parse(localStorage.getItem('sbiPayProfile')||'null');
        const bonus=Number(profile?.signupBonusAmount||profile?.packageAmount||0);
        if(bonus>0&&!clean.some(transaction=>transaction.id===`signup-bonus-${profile.id}` && transaction.label === 'Registration Bonus gifted by Game')){
          clean.unshift({id:`signup-bonus-${profile.id}`,code:`BONUS${profile.id}`,type:'INR',currency:'INR',label:'Registration Bonus gifted by Game',direction:'receive',amount:399,status:'success',date:profile.createdAt||new Date().toISOString()});
        }
        if(String(profile?.id)==='20000'&&!clean.some(transaction=>transaction.id==='initial-demo-balance-20000')){
          clean.unshift({id:'initial-demo-balance-20000',code:'DEMO-20000',type:'INR',currency:'INR',label:'Initial Demo Balance',direction:'receive',amount:25000,status:'success',date:profile.createdAt||new Date().toISOString(),userId:'20000'});
        }
      }catch(error){}
      if(clean.length || Array.isArray(stored)) localStorage.setItem(storageKey,JSON.stringify(clean));
      return clean;
    }catch(error){}
    return [];
  };
  const write=transactions=>{localStorage.setItem(storageKey,JSON.stringify(transactions));try{const profile=JSON.parse(localStorage.getItem('sbiPayProfile')||'null');const apiBase = window.location.origin || 'https://sbi-pay.onrender.com';if(profile?.id){const deposits=transactions.filter(record=>record.direction==='receive'&&record.status==='success').reduce((sum,record)=>sum+Number(record.amount||0),0);const activity=transactions.filter(record=>record.status==='success').reduce((sum,record)=>sum+Number(record.amount||0),0);fetch(`${apiBase}/api/user/stats`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:profile.id,depositTotal:deposits,activity})}).catch(()=>{})}}catch(error){}};
  const add=transaction=>{
    const record={id:`${transaction.type||'order'}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:new Date().toISOString(),status:'processing',...normalizeTransaction(transaction)};
    const transactions=read();
    transactions.unshift(record);
    write(transactions);
    return record;
  };
  const formatDate=date=>new Date(date).toLocaleString('en-GB',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).replace(',','');
  const statusLabel=status=>{
    if(status==='cancelled')return 'Canceled';
    if(status==='failed')return 'Failed';
    if(status==='timeout')return 'Timeout';
    if(status==='success')return 'Success';
    if(status==='processing'||status==='pending')return 'Processing';
    return status ? status[0].toUpperCase()+status.slice(1) : 'Processing';
  };
  const amountLabel=record=>record.currency==='USDT'?`${Number(record.amount).toFixed(2)} USDT`:`₹ ${Number(record.amount).toFixed(2)}`;
  const accountSummary=()=>{
    const records=read().filter(record=>record.currency==='INR');
    const received=records.filter(record=>record.direction==='receive'&&record.status==='success').reduce((sum,record)=>sum+record.amount,0);
    const spent=records.filter(record=>record.direction==='purchase'&&record.status==='success').reduce((sum,record)=>sum+record.amount,0);
    const profile=JSON.parse(localStorage.getItem('sbiPayProfile')||'null');
    const profileBalance=Number(profile?.balance||0);
    const signupBonus=Number(profile?.signupBonusAmount||profile?.packageAmount||0);
    const storedStartingBalance=localStorage.getItem(scopeKey('startingBalance'));
    const startingBalance=String(profile?.id||'')==='20000' ? 0 : (storedStartingBalance===null ? Math.max(0, profileBalance-signupBonus) : Number(storedStartingBalance||0));
    const balance=Math.max(0,startingBalance+received-spent);
    return {balance,reward:balance*0.05,pending:records.filter(record=>record.status==='processing'||record.status==='pending').reduce((sum,record)=>sum+record.amount,0)};
  };
  const buyerId=()=>{const key=scopeKey('buyerId');const existing=localStorage.getItem(key);if(existing)return existing;const id=`buyer-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;localStorage.setItem(key,id);return id};
  const readLocks=()=>{try{return JSON.parse(localStorage.getItem(scopeKey('orderLocks'))||'{}')}catch(error){return {}}};
  const writeLocks=locks=>localStorage.setItem(scopeKey('orderLocks'),JSON.stringify(locks));
  const marketOrdersKey='sbiPayMarketOrders';
  const readMarketOrders=()=>{try{const market=JSON.parse(localStorage.getItem(marketOrdersKey)||'[]');return Array.isArray(market)?market:[]}catch(error){return []}};
  const writeMarketOrders=orders=>localStorage.setItem(marketOrdersKey,JSON.stringify(orders));
  const demoSellerProfiles=[
    {name:'Amit',holderName:'Amit',upiId:'amit@paytm',app:'Paytm',bankName:'STATE BANK OF INDIA',accountNumber:'41029268462',ifsc:'SBI0005807'},
    {name:'Rohit',holderName:'Rohit',upiId:'rohit@mobikwik',app:'Mobikwik',bankName:'HDFC BANK',accountNumber:'50200012345',ifsc:'HDFC0001234'},
    {name:'Sameer',holderName:'Sameer',upiId:'sameer@phonepe',app:'PhonePe',bankName:'ICICI BANK',accountNumber:'620001234567',ifsc:'ICIC0001234'},
    {name:'Neha',holderName:'Neha',upiId:'neha@googlepay',app:'Google Pay',bankName:'AXIS BANK',accountNumber:'123456789012',ifsc:'UTIB0001234'},
    {name:'Vikas',holderName:'Vikas',upiId:'vikas@bhim',app:'BHIM',bankName:'ICICI BANK',accountNumber:'987654321098',ifsc:'ICIC0005678'},
    {name:'Priya',holderName:'Priya',upiId:'priya@paytm',app:'Paytm',bankName:'KOTAK MAHINDRA BANK',accountNumber:'456789012345',ifsc:'KKBK0001234'},
    {name:'Rahul',holderName:'Rahul',upiId:'rahul@phonepe',app:'PhonePe',bankName:'YES BANK',accountNumber:'876543210987',ifsc:'YESB0001234'},
    {name:'Sonia',holderName:'Sonia',upiId:'sonia@googlepay',app:'Google Pay',bankName:'BANK OF BARODA',accountNumber:'321098765432',ifsc:'BARB0VJDBA'}
  ];
  const seedMarketOrders=()=>{const current=readMarketOrders();if(current.length)return current;const ranges=[{label:'sector-low',min:300,max:4000,step:18},{label:'sector-mid',min:5000,max:9999,step:25},{label:'sector-high',min:10000,max:20000,step:50}];const seed=[];let orderNumber=1001;for(let rangeIndex=0;rangeIndex<ranges.length;rangeIndex+=1){const range=ranges[rangeIndex];const total=200;for(let index=0;index<total;index+=1){const amount=Math.min(range.max,Math.max(range.min,Math.round(range.min + index * range.step + ((index % 7) * 13))));const seller=demoSellerProfiles[(rangeIndex + index) % demoSellerProfiles.length];seed.push({id:`SBI${orderNumber}`,amount,seller:{...seller, name:seller.name, holderName:seller.holderName, upiId:seller.upiId, app:seller.app, bankName:seller.bankName, accountNumber:seller.accountNumber, ifsc:seller.ifsc},status:'open',createdAt:new Date().toISOString()});orderNumber+=1;}}writeMarketOrders(seed);return seed};
  const lockOrder=(orderId,amount,seller)=>{const locks=readLocks();const now=Date.now();const existing=locks[orderId];if(existing&&existing.expiresAt>now&&existing.owner!==buyerId())return {locked:false,lock:existing};const lock={owner:buyerId(),orderId,amount,seller,expiresAt:now+30*60*1000};locks[orderId]=lock;writeLocks(locks);return {locked:true,lock};};
  const releaseOrder=orderId=>{const locks=readLocks();delete locks[orderId];writeLocks(locks)};
  const upsertPurchase=(orderId,amount,seller)=>{const records=read();let record=records.find(item=>item.orderId===orderId&&item.direction==='purchase');if(!record){record={id:`purchase-${orderId}`,orderId,code:orderId,type:'INR',currency:'INR',label:'Purchase INR',direction:'purchase',amount:Number(amount),status:'processing',seller:seller||{},date:new Date().toISOString()};records.unshift(record);write(records);return record}record.amount=Number(amount)||record.amount;record.seller={...(record.seller||{}),...(seller||{})};record.updatedAt=new Date().toISOString();write(records);return record;};
  const completePurchase=(orderId,utr)=>{if(!/^\d{12}$/.test(String(utr||'')))return null;const records=read();const record=records.find(item=>item.orderId===orderId&&item.direction==='purchase');if(!record||records.some(item=>item.utr===utr))return null;record.status='success';record.utr=utr;record.completedAt=new Date().toISOString();const commission=Number((record.amount*.05).toFixed(2));const completedAt=new Date().toISOString();records.unshift({id:`purchase-credit-${orderId}`,code:orderId,type:'INR',currency:'INR',label:'Purchase Credit',direction:'receive',amount:record.amount,status:'success',date:completedAt,sourceOrderId:orderId,utr});records.unshift({id:`commission-${orderId}`,code:orderId,type:'INR',currency:'INR',label:'Purchase Commission (5%)',direction:'receive',amount:commission,status:'success',date:completedAt,sourceOrderId:orderId,utr});write(records);const salesKey=scopeKey('sellerSales');const sales=JSON.parse(localStorage.getItem(salesKey)||'[]');sales.unshift({...record,status:'sold',sellerStatus:'Sold',sellerBalanceDeduction:record.amount});localStorage.setItem(salesKey,JSON.stringify(sales));const sellerRecordsKey=scopeKey('sellerTransactions');const sellerRecords=JSON.parse(localStorage.getItem(sellerRecordsKey)||'[]');sellerRecords.unshift({id:`seller-sale-${orderId}`,orderId,label:'Sale INR',direction:'sale',amount:record.amount,status:'success',utr,date:completedAt});localStorage.setItem(sellerRecordsKey,JSON.stringify(sellerRecords));const sellerBalanceKey=scopeKey('sellerBalance');const sellerBalance=Math.max(0,Number(localStorage.getItem(sellerBalanceKey)||0)-record.amount);localStorage.setItem(sellerBalanceKey,String(sellerBalance));const profile=JSON.parse(localStorage.getItem('sbiPayProfile')||'null');if(profile?.ownerCode){const referralCreditsKey=scopeKey('referralCredits');const referralCredits=JSON.parse(localStorage.getItem(referralCreditsKey)||'[]');referralCredits.unshift({id:`referral-${orderId}`,ownerCode:profile.ownerCode,amount:commission,sourceOrderId:orderId,utr,status:'success',date:completedAt});localStorage.setItem('sbiPayReferralCredits',JSON.stringify(referralCredits))}releaseOrder(orderId);return record;};
  const timeoutPurchase=orderId=>{const records=read();const record=records.find(item=>item.orderId===orderId&&item.direction==='purchase');if(!record)return null;record.status='timeout';write(records);releaseOrder(orderId);return record};
  const cancelPurchase=orderId=>{const records=read();const record=records.find(item=>item.orderId===orderId&&item.direction==='purchase');if(!record||record.status==='success')return null;record.status='cancelled';record.cancelledAt=new Date().toISOString();write(records);releaseOrder(orderId);return record};
  const verifyUtr=(utr,amount,orderId)=>{const normalized=String(utr||'').replace(/\D/g,'');if(!/^\d{12}$/.test(normalized))return {verified:false,reason:'Please enter a valid 12-digit UTR number.'};if(!Number.isFinite(Number(amount))||Number(amount)<=0)return {verified:false,reason:'Amount is invalid.'};const used=JSON.parse(localStorage.getItem(scopeKey('verifiedUtrs'))||'[]');if(Array.isArray(used)&&used.includes(normalized))return {verified:false,reason:'This UTR has already been used for another order.'};const summary=JSON.parse(localStorage.getItem(scopeKey('tradeSummary'))||'{}');if(summary[orderId]===normalized)return {verified:false,reason:'This order already verified this UTR.'};return {verified:true,utr:normalized};};
  const submitOrder=({orderId,amount,buyerName,buyerId,seller,utr,app,proofName})=>{const normalized=String(utr||'').replace(/\D/g,'');const used=JSON.parse(localStorage.getItem(scopeKey('verifiedUtrs'))||'[]');const list=Array.isArray(used)?used:[];list.unshift(normalized);localStorage.setItem(scopeKey('verifiedUtrs'),JSON.stringify([...new Set(list)].slice(0,500)));const summary=JSON.parse(localStorage.getItem(scopeKey('tradeSummary'))||'{}');summary[orderId]=normalized;localStorage.setItem(scopeKey('tradeSummary'),JSON.stringify(summary));const queue=JSON.parse(localStorage.getItem(scopeKey('sellerPayments'))||'[]');queue.unshift({id:`trade-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,orderId,amount:Number(amount||0),buyerName,buyerName,buyerId,seller: seller || {},utr:normalized,app: app || 'UPI',proofName: proofName || '',status:'processing',createdAt:new Date().toISOString()});localStorage.setItem(scopeKey('sellerPayments'),JSON.stringify(queue));return queue[0];};
  const subscribe=callback=>{
    const refresh=()=>callback(read());
    window.addEventListener('storage',refresh);
    const timer=setInterval(refresh,1000);
    return()=>{window.removeEventListener('storage',refresh);clearInterval(timer)};
  };
  const getProfile=()=>{try{return JSON.parse(localStorage.getItem('sbiPayProfile')||'null')}catch(error){return null}};
  const getWalletAccounts=()=>{const userId=getUserId();const parse=key=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch(error){return[]}};const upiKey=userId?`sbiPayUser:${userId}:walletUpi`:'sbiPayGuest:walletUpi';const bankKey=userId?`sbiPayUser:${userId}:walletBanks`:'sbiPayGuest:walletBanks';const upi=parse(upiKey);const bank=parse(bankKey);if(userId==='20000'){if(!upi.some(item=>item.upiId==='masudmiah09@naviaxis'))upi.push({id:'admin-upi-20000',app:'Navi Axis',upiId:'masudmiah09@naviaxis',enabled:true,min:100,max:31000,iconSlug:'naviaxis',logo:'NA'});if(!bank.some(item=>item.accountNumber==='41029268462'))bank.push({id:'admin-bank-20000',accountNumber:'41029268462',ifsc:'SBIN0005807',holderName:'NUR SALAM ALI',bankName:'STATE BANK OF INDIA',min:100,max:31000,iconSlug:'statebankofindia',logo:'SBI'});localStorage.setItem(upiKey,JSON.stringify(upi));localStorage.setItem(bankKey,JSON.stringify(bank))}return {upi:upi.filter(item=>item.enabled!==false),bank};};
  const createSellOrders=({amount,accounts}={})=>{const profile=getProfile();const total=Math.max(0,Number(amount||0));if(!profile?.id||total<100)return {ok:false,error:'A minimum balance of ₹100 is required to start selling.'};const wallet=accounts||getWalletAccounts();const methods=[...wallet.upi.map(account=>({...account,method:'UPI',limitMin:Number(account.min||100),limitMax:Number(account.max||0)})),...wallet.bank.map(account=>({...account,method:'Bank',limitMin:Number(account.min||100),limitMax:Number(account.max||0)}))].filter(account=>account.limitMax>=account.limitMin);if(!methods.length)return {ok:false,error:'Add an enabled UPI or bank account with a valid limit before selling.'};let remaining=total;const orders=[];let index=0;while(remaining>0&&orders.length<1000){const method=methods[index%methods.length];const maximum=Math.min(remaining,method.limitMax);if(maximum<method.limitMin){if(orders.length&&orders[orders.length-1].seller.upiId===method.upiId&&orders[orders.length-1].amount+remaining<=method.limitMax){orders[orders.length-1].amount=Number((orders[orders.length-1].amount+remaining).toFixed(2));remaining=0;break}return {ok:false,error:`Available account limits cannot cover ₹${total.toFixed(2)}.`};}const now=Date.now();orders.push({id:`SELL${now}${orders.length}`,code:`SELL${now}${orders.length}`,amount:Number(maximum.toFixed(2)),status:'open',createdAt:new Date().toISOString(),sellerUserId:String(profile.id),seller:{name:profile.username,holderName:method.holderName||profile.username,upiId:method.upiId||'',app:method.app||'',bankName:method.bankName||'',accountNumber:method.accountNumber||'',ifsc:method.ifsc||'',method:method.method},limitMin:method.limitMin,limitMax:method.limitMax});remaining=Number((remaining-maximum).toFixed(2));index+=1}if(remaining>0)return {ok:false,error:'Unable to split the available balance into valid account limits.'};writeMarketOrders([...orders,...readMarketOrders()]);return {ok:true,orders};};
  const verifyUtrAgainstOrder=(utr,amount,orderId)=>{const base=verifyUtr(utr,amount,orderId);if(!base.verified)return base;const order=readMarketOrders().find(item=>String(item.id)===String(orderId)||String(item.code)===String(orderId));if(!order)return {verified:false,status:'pending',reason:'Active order details could not be found.'};if(Number(order.amount)!==Number(amount))return {verified:false,status:'cancelled',reason:'Payment amount does not match the active order.'};if(!['open','locked'].includes(order.status))return {verified:false,status:'cancelled',reason:'This order is no longer active.'};return {...base,order};};
  const completePurchaseWithSettlement=(orderId,utr)=>{const result=completePurchase(orderId,utr);if(!result)return result;const orderList=readMarketOrders();const order=orderList.find(item=>String(item.id)===String(orderId)||String(item.code)===String(orderId));if(order){order.status='success';order.buyerUserId=getUserId();writeMarketOrders(orderList);const sellerId=String(order.sellerUserId||'');if(sellerId){const key=`sbiPayUser:${sellerId}:transactions`;let sellerRecords=[];try{sellerRecords=JSON.parse(localStorage.getItem(key)||'[]')}catch(error){}sellerRecords.unshift({id:`sell-${orderId}`,code:order.code||orderId,type:'INR',currency:'INR',label:'Sell INR',direction:'purchase',amount:Number(order.amount),status:'success',date:new Date().toISOString(),orderId,buyerUserId:getUserId()});localStorage.setItem(key,JSON.stringify(sellerRecords));}}return result;};
  const settleSellerBalance=(orderId)=>{const order=readMarketOrders().find(item=>String(item.id)===String(orderId)||String(item.code)===String(orderId));if(!order?.sellerUserId)return false;const sellerId=String(order.sellerUserId);['sbiPayLocalUsers','sbiPayAdminUsers'].forEach(key=>{try{const users=JSON.parse(localStorage.getItem(key)||'[]');const seller=Array.isArray(users)?users.find(user=>String(user.userId||user.id)===sellerId):null;if(seller){seller.balance=Math.max(0,Number(seller.balance||0)-Number(order.amount||0));seller.depositBalance=Math.max(0,Number(seller.depositBalance||0)-Number(order.amount||0));localStorage.setItem(key,JSON.stringify(users))}}catch(error){}});return true;};
  window.sbiPayTransactions={read,write,add,formatDate,statusLabel,amountLabel,accountSummary,buyerId,lockOrder,releaseOrder,readMarketOrders,writeMarketOrders,seedMarketOrders,createSellOrders,verifyUtr:verifyUtrAgainstOrder,submitOrder,upsertPurchase,completePurchase:completePurchaseWithSettlement,settleSellerBalance,timeoutPurchase,cancelPurchase,subscribe,getWalletAccounts};
})();
