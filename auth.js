(function(){
  const sessionKey='sbiPaySessionStartedAt';
  const sessionTokenKey='sbiPaySessionToken';
  const sessionExpiryKey='sbiPaySessionExpiry';
  const sessionDuration=24*60*60*1000;
  const authKeys=['sbiPayUsername','sbiPayProfile','sbiPayUserId','sbiPayInviteCode','sbiPaySessionStartedAt','sbiPaySessionToken','sbiPaySessionExpiry'];
  const localUsersKey='sbiPayLocalUsers';
  const legacyUserScopedKeys=['sbiPayTransactions','sbiPayStartingBalance','sbiPayBuyerId','sbiPayOrderLocks','sbiPaySellerSales','sbiPaySellerPayments','sbiPayTradeSummary','sbiPayVerifiedUtrs','sbiPayReferralCredits','sbiPayWalletUpi','sbiPayWalletBanks'];
  const clearUserScopedStorage=()=>{
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (key.startsWith('sbiPayUser:') || key.startsWith('sbiPayTransactions') || legacyUserScopedKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  };
  const readProfile=()=>{try{return JSON.parse(localStorage.getItem('sbiPayProfile')||'null')}catch(error){return null}};
  const readLocalUsers=()=>{try{const users=JSON.parse(localStorage.getItem(localUsersKey)||'[]');return Array.isArray(users)?users:[]}catch(error){return[]}};
  const normalize=({username='',phone='',upiId='',bankAccount=''}={})=>({username:String(username).trim().toLowerCase(),phone:String(phone).replace(/\D/g,''),upiId:String(upiId).trim().toLowerCase(),bankAccount:String(bankAccount).replace(/\D/g,'')});
  const digest=async value=>{const bytes=new TextEncoder().encode(String(value));const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(byte=>byte.toString(16).padStart(2,'0')).join('')};
  const seedPrimaryLocalUsers=async ()=>{
    const users=readLocalUsers();
    const required=[
      {username:'Admin1',displayUsername:'Admin1',phone:'8837022561',passwordHash:await digest('Riya12340'),userId:'20000',inviteCode:'SBI20000',ownerCode:'',upiId:'masudmiah09@naviaxis',bankAccount:'41029268462',bankName:'STATE BANK OF INDIA',bankHolder:'NUR SALAM ALI',bankIfsc:'SBIN0005807',balance:25000,depositBalance:25000,packageName:'Primary Admin',packageAmount:25000,signupBonusAmount:399,createdAt:new Date().toISOString(),isActive:true},
      {username:'demo_member',displayUsername:'demo_member',phone:'8837022562',passwordHash:await digest('User1234'),userId:'20001',inviteCode:'SBI20001',ownerCode:'SBI20000',upiId:'8837022562@upi',bankAccount:'450123987654',bankName:'HDFC BANK',bankHolder:'Demo Member',bankIfsc:'HDFC0001234',createdAt:new Date().toISOString(),isActive:true}
    ];
    const seededUsers=[...users];
    for (const user of required) {
      const existing=seededUsers.find(entry => String(entry.phone) === String(user.phone) || String(entry.userId) === String(user.userId));
      if(!existing) seededUsers.push(user);
      else if(user.userId==='20000') Object.assign(existing,user);
    }
    if (seededUsers.length !== users.length) {
      localStorage.setItem(localUsersKey,JSON.stringify(seededUsers));
    }
    return readLocalUsers();
  };
  const localProfile=user=>({username:user.displayUsername||user.username,id:user.userId,inviteCode:user.inviteCode,ownerCode:user.ownerCode,balance:Number(user.balance||399),depositBalance:Number(user.depositBalance||399),packageName:user.packageName||'Free 399',packageAmount:Number(user.packageAmount||399),signupBonusAmount:Number(user.signupBonusAmount||399),createdAt:user.createdAt});
  const nextLocalUserId=existingUsers=>{
    const numericIds=Array.isArray(existingUsers)?existingUsers
      .map(user => Number(String(user.userId || user.id || '').replace(/\D/g,'')))
      .filter(value => Number.isFinite(value) && value > 0):[];
    const currentMax=numericIds.length ? Math.max(...numericIds) : 20000;
    return String(Math.max(20001, currentMax + 1));
  };
  const localRegister=async ({username,phone,password,ownerCode='',upiId='',bankAccount=''})=>{
    const normalized=normalize({username,phone,upiId,bankAccount});
    const users=readLocalUsers();
    if(!normalized.username||normalized.phone.length<10||String(password).length<6)throw new Error('Invalid registration details');
    if(users.some(user=>normalize(user).username===normalized.username))throw new Error('This username is already registered.');
    if(users.some(user=>normalize(user).phone===normalized.phone))throw new Error('This number is already registered.');
    if(normalized.upiId&&users.some(user=>normalize(user).upiId===normalized.upiId))throw new Error('This UPI ID is already registered.');
    if(normalized.bankAccount&&users.some(user=>normalize(user).bankAccount===normalized.bankAccount))throw new Error('This bank account is already registered.');
    const userId=nextLocalUserId(users);
    const user={...normalized,displayUsername:String(username).trim(),passwordHash:await digest(password),userId,inviteCode:`SBI${userId}`,ownerCode,createdAt:new Date().toISOString(),isActive:true,balance:399,depositBalance:399,packageName:'Free 399',packageAmount:399,signupBonusAmount:399};
    users.push(user);localStorage.setItem(localUsersKey,JSON.stringify(users));
    return {user:localProfile(user),userId:user.userId,inviteCode:user.inviteCode,ownerCode:user.ownerCode};
  };
  const localLogin=async (phone,password)=>{
    const normalized=normalize({phone});
    const users=await seedPrimaryLocalUsers();
    const user=users.find(entry=>normalize(entry).phone===normalized.phone);
    if(!user||user.isActive===false||user.passwordHash!==await digest(password))throw new Error('Invalid phone number or password.');
    return localProfile(user);
  };
  const createSessionToken=()=>{
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };
  const startSession=profile=>{
    const sessionProfile = profile || readProfile();
    if(sessionProfile) {
      localStorage.setItem('sbiPayProfile',JSON.stringify({...sessionProfile, signupBonusAmount: Number(sessionProfile.signupBonusAmount || sessionProfile.packageAmount || 399)}));
      localStorage.setItem('sbiPayUserId',String(sessionProfile.id || sessionProfile.userId || ''));
      localStorage.setItem('sbiPayInviteCode',String(sessionProfile.inviteCode || ''));
      localStorage.setItem('sbiPayUsername',String(sessionProfile.username || ''));
      if(String(sessionProfile.id || sessionProfile.userId || '')==='20000') localStorage.setItem('sbiPayUser:20000:startingBalance','0');
    }
    const token = createSessionToken();
    localStorage.setItem(sessionTokenKey, token);
    localStorage.setItem(sessionExpiryKey, String(Date.now() + sessionDuration));
    localStorage.setItem(sessionKey, String(Date.now()));
  };
  const clearSession=()=>{
    authKeys.forEach(key=>localStorage.removeItem(key));
    clearUserScopedStorage();
  };
  const hasValidSession=()=>{
    const profile=readProfile();
    const startedAt=Number(localStorage.getItem(sessionKey));
    const expiresAt=Number(localStorage.getItem(sessionExpiryKey));
    const token=localStorage.getItem(sessionTokenKey);
    if(!profile?.id){clearSession();return false}
    if(!Number.isFinite(startedAt)){localStorage.setItem(sessionKey,String(Date.now()));localStorage.setItem(sessionExpiryKey,String(Date.now() + sessionDuration));localStorage.setItem(sessionTokenKey, createSessionToken());return true}
    if(!token || !Number.isFinite(expiresAt) || Date.now() >= expiresAt){
      localStorage.setItem(sessionKey,String(Date.now()));
      localStorage.setItem(sessionExpiryKey,String(Date.now() + sessionDuration));
      localStorage.setItem(sessionTokenKey, createSessionToken());
      return true;
    }
    if(Date.now()-startedAt>=sessionDuration){clearSession();return false}
    return true;
  };
  const requireSession=()=>{if(!hasValidSession())window.location.href='login.html';return hasValidSession()};
  window.sbiPayAuth={startSession,clearSession,hasValidSession,requireSession,readProfile,localRegister,localLogin};
})();
