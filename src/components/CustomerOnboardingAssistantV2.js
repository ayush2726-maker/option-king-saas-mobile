const React = require('react');
const RN = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } = RN;
const API = 'https://option-king-saas-production.up.railway.app';
const BROKER_PORTALS = {
  angelone: 'https://smartapi.angelone.in/publisher-login/v2/login/',
  upstox: 'https://account.upstox.com/developer/apps',
};
const UPSTOX_REDIRECT_URL = 'https://option-king-saas-production.up.railway.app/upstox/callback';
const UPSTOX_POSTBACK_URL = 'https://option-king-saas-production.up.railway.app/upstox/postback';

async function authToken() {
  for (const key of ['saas_token','token','auth_token','okai_token','access_token']) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value && String(value).length > 20) return String(value);
    } catch (_) {}
  }
  return '';
}

async function api(path, token, method='GET', body) {
  const url = API + path + (method === 'GET' ? (path.includes('?') ? '&' : '?') + '_ts=' + Date.now() : '');
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      'Cache-Control': 'no-cache',
      ...(body !== undefined ? {'Content-Type':'application/json'} : {}),
    },
    ...(body !== undefined ? {body: JSON.stringify(body)} : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || data?.message || `Request failed (${response.status})`);
  return data;
}

function navigate(route) {
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__OKAI_WEB_NAVIGATE__ === 'function') {
      return Boolean(globalThis.__OKAI_WEB_NAVIGATE__(route));
    }
  } catch (_) {}
  return false;
}

function Btn({label,onPress,disabled,kind='blue'}) {
  const bg = disabled ? '#202a39' : kind === 'green' ? '#0e5947' : kind === 'red' ? '#5a1d2b' : '#174c85';
  const border = disabled ? '#39465a' : kind === 'green' ? '#21a981' : kind === 'red' ? '#a83d52' : '#3d82c4';
  return React.createElement(TouchableOpacity,{
    onPress,disabled,activeOpacity:.84,
    style:{marginTop:9,minHeight:44,borderRadius:11,backgroundColor:bg,borderWidth:1,borderColor:border,alignItems:'center',justifyContent:'center',paddingHorizontal:12}
  },React.createElement(Text,{style:{color:disabled?'#77859a':'#f0f7ff',fontWeight:'900',fontSize:12,textAlign:'center'}},label));
}

function Step({n,title,detail,done,active,expanded,onPress,children}) {
  const c = done ? '#00d4a0' : active ? '#4d9fff' : '#66758a';
  return React.createElement(View,{style:{marginBottom:10}},
    React.createElement(TouchableOpacity,{onPress,activeOpacity:.82,style:{flexDirection:'row',gap:12,paddingVertical:7}},
      React.createElement(View,{style:{width:36,height:36,borderRadius:18,borderWidth:1,borderColor:c,backgroundColor:c+'20',alignItems:'center',justifyContent:'center'}},
        React.createElement(Text,{style:{color:c,fontWeight:'900',fontSize:15}},done?'✓':String(n))
      ),
      React.createElement(View,{style:{flex:1,minWidth:0}},
        React.createElement(View,{style:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}},
          React.createElement(Text,{style:{color:'#f2f6ff',fontWeight:'900',fontSize:15,flex:1}},title),
          React.createElement(Text,{style:{color:'#7fa2cc',fontSize:18,fontWeight:'900'}},expanded?'⌃':'›')
        ),
        React.createElement(Text,{style:{color:'#9aabc2',fontSize:12,lineHeight:18,marginTop:3}},detail)
      )
    ),
    expanded ? React.createElement(View,{style:{marginLeft:48,marginTop:3,marginBottom:8,padding:12,borderRadius:12,backgroundColor:'#111c2c',borderWidth:1,borderColor:'#263d5b'}},children) : null
  );
}

function GuideRow({label,value,note}) {
  return React.createElement(View,{style:{paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#26364c'}},
    React.createElement(Text,{style:{color:'#7dbdff',fontSize:10,fontWeight:'900'}},label),
    React.createElement(Text,{selectable:true,style:{color:'#fff',fontSize:12,fontWeight:'800',lineHeight:18,marginTop:3}},value),
    note ? React.createElement(Text,{style:{color:'#91a4bd',fontSize:10,lineHeight:15,marginTop:2}},note) : null
  );
}

function CustomerOnboardingAssistantV2({children}) {
  const [open,setOpen] = React.useState(false);
  const [state,setState] = React.useState(null);
  const [loading,setLoading] = React.useState(false);
  const [busy,setBusy] = React.useState('');
  const [error,setError] = React.useState('');
  const [expanded,setExpanded] = React.useState(2);
  const [paperAck,setPaperAck] = React.useState(false);

  const load = React.useCallback(async()=>{
    const t = await authToken();
    if (!t) { setState(null); return; }
    setLoading(true);
    try {
      const [me,ent,brokers,gateway,prov] = await Promise.all([
        api('/auth/me',t).catch(()=>({})),
        api('/subscription/entitlements',t).catch(()=>({})),
        api('/broker/list',t).catch(()=>({})),
        api('/local-gateway/status',t).catch(()=>({})),
        api('/local-gateway/provision/status',t).catch(()=>({})),
      ]);
      const user = me?.user || me || {};
      const selected = String(brokers?.selected_broker || '').toLowerCase();
      const saved = Array.isArray(brokers?.brokers) ? brokers.brokers : [];
      const p = prov?.provisioning || {};
      const chosenBroker = selected || String(p?.broker_name || '').toLowerCase();
      const assignedIp = String(p?.static_ip || gateway?.expected_static_ip || '').trim();
      const gatewayReady = Boolean(gateway?.paired && gateway?.online && gateway?.enabled !== false && gateway?.static_ip_matches !== false && assignedIp);
      const brokerReady = Boolean(selected || saved.some(x=>x?.selected || x?.is_active));
      const userId = Number(user?.id || 0);
      let ack = false;
      if (userId) {
        try { ack = (await AsyncStorage.getItem('okai_paper_test_ack_' + userId)) === '1'; } catch (_) {}
      }
      setPaperAck(ack);
      setState({
        userId,
        isAdmin:Boolean(user?.is_admin),
        ent,
        selected,
        chosenBroker,
        brokerReady,
        assignedIp,
        gatewayReady,
        gateway,
        provisioning:p,
        provisionState:String(p?.state || 'not_requested').toLowerCase(),
        ipConfirmed:Boolean(p?.broker_ip_confirmed_at),
      });
    } finally { setLoading(false); }
  },[]);

  React.useEffect(()=>{ load(); const id=setInterval(load,8000); return()=>clearInterval(id); },[load]);
  if (!state || state.isAdmin) return children;

  const liveAllowed = Boolean(state.ent?.live_allowed);
  const paperAllowed = Boolean(state.ent?.paper_allowed);
  const liveDays = Number(state.ent?.live_days_remaining ?? 0);
  const paperDays = Number(state.ent?.paper_days_remaining ?? 0);
  const provisionStarted = ['requested','allocating','bootstrapping','ready'].includes(state.provisionState);

  let stage = 2;
  if (state.assignedIp) stage = 3;
  if (state.brokerReady) stage = 4;
  if (state.brokerReady && paperAck) stage = 5;
  if (state.brokerReady && paperAck && state.gatewayReady && state.ipConfirmed) stage = 6;
  if (!liveAllowed && state.brokerReady) stage = 6;

  const toggle = n => setExpanded(v=>v===n?0:n);
  const openRoute = route => { setOpen(false); setTimeout(()=>navigate(route),80); };

  const requestAllocation = async()=>{
    const t = await authToken();
    if (!t) return;
    setBusy('allocate'); setError('');
    try {
      await api('/local-gateway/provision/request',t,'POST',{});
      setExpanded(2);
      await load();
    } catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(''); }
  };

  const chooseBrokerAndOpenPortal = async brokerName => {
    const t = await authToken();
    const portal = BROKER_PORTALS[brokerName];
    if (!t || !state.assignedIp || !portal) return;
    setBusy('broker'); setError('');
    try {
      await api('/local-gateway/provision/request',t,'POST',{broker_name:brokerName});
      await load();
      await RN.Linking.openURL(portal);
    } catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(''); }
  };

  const reopenBrokerPortal = async()=>{
    const portal = BROKER_PORTALS[state.chosenBroker];
    if (!portal) return;
    setError('');
    try { await RN.Linking.openURL(portal); }
    catch (e) { setError(String(e?.message || e)); }
  };

  const markPaperTested = async()=>{
    if (state.userId) {
      try { await AsyncStorage.setItem('okai_paper_test_ack_' + state.userId,'1'); } catch (_) {}
    }
    setPaperAck(true);
    setExpanded(5);
  };

  const confirmIp = async()=>{
    const t = await authToken(); if (!t) return;
    setBusy('confirm'); setError('');
    try {
      await api('/local-gateway/provision/confirm-ip',t,'POST',{confirmation:'IP REGISTERED'});
      await load();
    } catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(''); }
  };

  const doEnableLive = async()=>{
    const t = await authToken(); if (!t) return;
    setBusy('live'); setError('');
    try {
      await api('/local-gateway/provision/enable-live',t,'POST',{confirmation:'ENABLE LIVE TRADING'});
      await load();
      Alert.alert('Live Trading Ready','Live mode enabled. Real orders will be possible only after you press Start Bot.');
    } catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(''); }
  };

  const askEnableLive = ()=>{
    if (RN.Platform.OS === 'web' && typeof globalThis !== 'undefined' && typeof globalThis.confirm === 'function') {
      if (globalThis.confirm('Enable LIVE trading? Real-money orders can be placed after you press Start Bot.')) doEnableLive();
      return;
    }
    Alert.alert('Enable LIVE Trading?','After this, pressing Start Bot can place real-money broker orders.',[
      {text:'Cancel',style:'cancel'},
      {text:'Enable Live',style:'destructive',onPress:doEnableLive},
    ]);
  };

  const brokerName = state.chosenBroker === 'angelone' ? 'Angel One' : state.chosenBroker === 'upstox' ? 'Upstox' : '';
  const ip = state.assignedIp || 'Preparing...';

  return React.createElement(React.Fragment,null,
    children,
    React.createElement(TouchableOpacity,{onPress:()=>{setExpanded(stage);setOpen(true);},activeOpacity:.86,style:{position:'absolute',right:12,bottom:RN.Platform.OS==='web'?18:86,zIndex:9999,minHeight:46,paddingHorizontal:15,borderRadius:23,backgroundColor:'#0f5ecf',borderWidth:1,borderColor:'#4d9fff',alignItems:'center',justifyContent:'center',elevation:14}},
      React.createElement(Text,{style:{color:'#fff',fontWeight:'900',fontSize:12}},'🚀 Set Up Live Trading')
    ),
    React.createElement(Modal,{visible:open,transparent:true,animationType:'slide',onRequestClose:()=>setOpen(false)},
      React.createElement(View,{style:{flex:1,backgroundColor:'rgba(2,7,15,.92)',justifyContent:'flex-end'}},
        React.createElement(View,{style:{maxHeight:'92%',backgroundColor:'#0b1220',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:'#263951',padding:18}},
          React.createElement(View,{style:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}},
            React.createElement(View,{style:{flex:1,paddingRight:10}},
              React.createElement(Text,{style:{color:'#fff',fontSize:22,fontWeight:'900'}},'Live Trading Setup'),
              React.createElement(Text,{style:{color:'#91a4bd',fontSize:12,marginTop:3}},'Complete one step at a time. Your next step opens automatically.')
            ),
            React.createElement(TouchableOpacity,{onPress:()=>setOpen(false),style:{width:38,height:38,borderRadius:19,backgroundColor:'#172338',alignItems:'center',justifyContent:'center'}},React.createElement(Text,{style:{color:'#fff',fontSize:22}},'×'))
          ),
          React.createElement(View,{style:{flexDirection:'row',gap:8,marginBottom:14}},
            React.createElement(View,{style:{flex:1,padding:11,borderRadius:12,backgroundColor:'#10231f',borderWidth:1,borderColor:'#1e6a55'}},
              React.createElement(Text,{style:{color:'#78deb0',fontSize:10,fontWeight:'900'}},'PAPER FREE'),
              React.createElement(Text,{style:{color:'#fff',fontSize:15,fontWeight:'900',marginTop:2}},paperAllowed?`${paperDays} days left`:'Expired')
            ),
            React.createElement(View,{style:{flex:1,padding:11,borderRadius:12,backgroundColor:'#122038',borderWidth:1,borderColor:'#315c91'}},
              React.createElement(Text,{style:{color:'#73b8ff',fontSize:10,fontWeight:'900'}},'LIVE ACCESS'),
              React.createElement(Text,{style:{color:'#fff',fontSize:15,fontWeight:'900',marginTop:2}},liveAllowed?(state.ent?.live_access==='trial'?`${liveDays} days left`:'Active'):'Locked')
            )
          ),
          React.createElement(ScrollView,{contentContainerStyle:{paddingBottom:16},keyboardShouldPersistTaps:'handled'},
            React.createElement(Step,{n:1,title:'Account Created',detail:'Your Option King AI login is ready.',done:true,active:false,expanded:expanded===1,onPress:()=>toggle(1)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'You can view account, trial and subscription details here.'),
              React.createElement(Btn,{label:'Open Account',onPress:()=>openRoute('account')})
            ),

            React.createElement(Step,{n:2,title:'Get Your Dedicated Static IP',detail:state.assignedIp?`Dedicated IP ready: ${state.assignedIp}`:provisionStarted?'AWS is preparing your dedicated IP automatically.':'Allocate your secure IP before creating broker credentials.',done:Boolean(state.assignedIp),active:stage===2,expanded:expanded===2,onPress:()=>toggle(2)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'Option King AI creates a dedicated AWS execution server and Elastic IP for your account. No Termux, VPN, second phone or gateway commands are required.'),
              React.createElement(View,{style:{marginTop:10,padding:11,borderRadius:10,backgroundColor:'#0c1725',borderWidth:1,borderColor:'#2a4a6d'}},
                React.createElement(Text,{style:{color:'#7dbdff',fontSize:10,fontWeight:'900'}},'YOUR LIVE ORDER STATIC IP'),
                React.createElement(Text,{style:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:4}},ip),
                React.createElement(Text,{style:{color:'#91a4bd',fontSize:11,lineHeight:16,marginTop:4}},state.assignedIp?'Use this exact IP in your broker Developer / API App settings. This IP is dedicated to your Option King AI account.':`Status: ${state.provisionState.replaceAll('_',' ')}`)
              ),
              React.createElement(Btn,{label:state.assignedIp?'Refresh IP Status':busy==='allocate'?'Starting...':'Allocate My Secure IP',onPress:state.assignedIp?load:requestAllocation,disabled:busy==='allocate'})
            ),

            React.createElement(Step,{n:3,title:'Select Broker & Create API Credentials',detail:state.brokerReady?`${brokerName || 'Broker'} connected successfully.`:state.chosenBroker?`${brokerName} selected. Create the API, then enter its credentials in Option King AI.`:state.assignedIp?'Select Angel One or Upstox. The official API creation page will open.':'Wait for your dedicated IP first.',done:state.brokerReady,active:stage===3,expanded:expanded===3,onPress:()=>toggle(3)},
              React.createElement(View,{style:{padding:10,borderRadius:10,backgroundColor:'#0c1725',borderWidth:1,borderColor:'#2a4a6d'}},
                React.createElement(Text,{style:{color:'#7dbdff',fontSize:10,fontWeight:'900'}},'ENTER THIS STATIC IP IN THE BROKER APP'),
                React.createElement(Text,{style:{color:'#fff',fontSize:17,fontWeight:'900',marginTop:3}},state.assignedIp || 'Waiting for IP')
              ),
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:19,marginTop:10}},'Choose your broker below. Its official Developer / API Apps page will open. Log in, create a Trading API app and enter the exact static IP shown above.'),
              React.createElement(View,{style:{flexDirection:'row',gap:8}},
                React.createElement(View,{style:{flex:1}},React.createElement(Btn,{label:busy==='broker'?'Opening...':'Angel One — Create API',onPress:()=>chooseBrokerAndOpenPortal('angelone'),disabled:!state.assignedIp || busy==='broker',kind:state.chosenBroker==='angelone'?'green':'blue'})),
                React.createElement(View,{style:{flex:1}},React.createElement(Btn,{label:busy==='broker'?'Opening...':'Upstox — Create API',onPress:()=>chooseBrokerAndOpenPortal('upstox'),disabled:!state.assignedIp || busy==='broker',kind:state.chosenBroker==='upstox'?'green':'blue'}))
              ),
              state.chosenBroker==='angelone'
                ? React.createElement(View,{style:{marginTop:10,padding:11,borderRadius:10,backgroundColor:'#111c2c',borderWidth:1,borderColor:'#31557c'}},
                    React.createElement(Text,{style:{color:'#f2f6ff',fontSize:12,fontWeight:'900'}},'Fill these fields in Angel One SmartAPI'),
                    React.createElement(GuideRow,{label:'APP NAME',value:'Option King AI'}),
                    React.createElement(GuideRow,{label:'API / APP TYPE',value:'Trading API / Self-coded (Personal)',note:'Choose the trading-order API option if the portal shows multiple API products.'}),
                    React.createElement(GuideRow,{label:'PRIMARY STATIC IP',value:state.assignedIp || 'Wait for Step 2'}),
                    React.createElement(GuideRow,{label:'SECONDARY STATIC IP',value:'Leave blank',note:'Only the dedicated Primary IP is required for this setup.'}),
                    React.createElement(Text,{style:{color:'#78deb0',fontSize:11,fontWeight:'900',marginTop:10}},'After Create App, copy the API Key. Then fill Option King AI:'),
                    React.createElement(GuideRow,{label:'CLIENT ID',value:'Your Angel One login/client ID (example: A123456)'}),
                    React.createElement(GuideRow,{label:'API KEY',value:'API Key shown in the created SmartAPI app'}),
                    React.createElement(GuideRow,{label:'MPIN',value:'Your 4-digit Angel One login MPIN'}),
                    React.createElement(GuideRow,{label:'TOTP SECRET',value:'Secret setup key shown below the TOTP QR code',note:'Do not enter the changing 6-digit OTP. Enter the permanent TOTP secret key.'})
                  )
                : state.chosenBroker==='upstox'
                  ? React.createElement(View,{style:{marginTop:10,padding:11,borderRadius:10,backgroundColor:'#111c2c',borderWidth:1,borderColor:'#31557c'}},
                      React.createElement(Text,{style:{color:'#f2f6ff',fontSize:12,fontWeight:'900'}},'Fill these fields in Upstox Developer Apps'),
                      React.createElement(GuideRow,{label:'APP NAME',value:'Option King AI'}),
                      React.createElement(GuideRow,{label:'APP TYPE',value:'Algo Trading App',note:'Use the normal/live app, not Sandbox or Analytics Token for order placement.'}),
                      React.createElement(GuideRow,{label:'REDIRECT URL',value:UPSTOX_REDIRECT_URL,note:'Paste exactly without adding spaces.'}),
                      React.createElement(GuideRow,{label:'POSTBACK / NOTIFIER URL',value:UPSTOX_POSTBACK_URL,note:'Enter this only when the portal shows the field.'}),
                      React.createElement(GuideRow,{label:'PRIMARY STATIC IP',value:state.assignedIp || 'Wait for Step 2'}),
                      React.createElement(GuideRow,{label:'SECONDARY STATIC IP',value:'Leave blank'}),
                      React.createElement(GuideRow,{label:'ALGO NAME',value:'Leave blank unless Upstox has approved an Algo Name'}),
                      React.createElement(Text,{style:{color:'#78deb0',fontSize:11,fontWeight:'900',marginTop:10}},'After Create App, fill Option King AI:'),
                      React.createElement(GuideRow,{label:'API KEY (CLIENT ID)',value:'API Key shown in the created Upstox app'}),
                      React.createElement(GuideRow,{label:'API SECRET',value:'API Secret shown in the created Upstox app'}),
                      React.createElement(GuideRow,{label:'DAILY ACCESS TOKEN',value:'Generate the standard Access Token from the app',note:'Do not use Analytics Token for live order placement. Upstox does not need a TOTP field here.'})
                    )
                  : null,
              state.chosenBroker ? React.createElement(Btn,{label:`Open ${brokerName} API Page Again`,onPress:reopenBrokerPortal,disabled:!state.assignedIp}) : null,
              React.createElement(Btn,{label:state.brokerReady?'Review Broker Connection':state.chosenBroker?'Enter Credentials in Option King AI':'Select a Broker First',onPress:()=>openRoute('broker'),disabled:!state.assignedIp || !state.chosenBroker})
            ),

            React.createElement(Step,{n:4,title:'Test Paper Trading First',detail:paperAck?'Paper test marked complete.':'Open Paper mode, start the bot and confirm status/signals before Live.',done:paperAck,active:stage===4,expanded:expanded===4,onPress:()=>toggle(4)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},paperAllowed?'Paper mode uses no real money. Check capital, broker status, signals, entry/exit display and bot start/stop once before enabling Live.':'Paper access has expired; activate a plan to continue.'),
              React.createElement(Btn,{label:paperAllowed?'Open Paper Bot':'Paper Access Expired',onPress:()=>openRoute('bot'),disabled:!paperAllowed || !state.brokerReady}),
              React.createElement(Btn,{label:paperAck?'Paper Test Completed ✓':'I Tested Paper — Continue',onPress:markPaperTested,disabled:!paperAllowed || !state.brokerReady,kind:paperAck?'green':'blue'})
            ),

            React.createElement(Step,{n:5,title:'Verify Secure Connection',detail:state.gatewayReady?(state.ipConfirmed?'Secure connection and broker IP registration verified.':'Cloud gateway is online. Confirm that you registered the IP in your broker app.'):'Cloud gateway will come online after broker credentials are connected.',done:state.gatewayReady && state.ipConfirmed,active:stage===5,expanded:expanded===5,onPress:()=>toggle(5)},
              React.createElement(View,{style:{padding:10,borderRadius:10,backgroundColor:'#0c1725',borderWidth:1,borderColor:'#2a4a6d'}},
                React.createElement(Text,{style:{color:'#7dbdff',fontSize:10,fontWeight:'900'}},'REGISTER THIS IP IN YOUR BROKER'),
                React.createElement(Text,{style:{color:'#fff',fontSize:17,fontWeight:'900',marginTop:3}},state.assignedIp || 'Waiting for IP'),
                React.createElement(Text,{style:{color:'#91a4bd',fontSize:11,lineHeight:16,marginTop:4}},state.gatewayReady?'Secure AWS gateway is online from this IP.':'The app is waiting for the dedicated gateway heartbeat.')
              ),
              React.createElement(Btn,{label:state.ipConfirmed?'IP Registered ✓':busy==='confirm'?'Confirming...':'I Registered This IP in Broker',onPress:confirmIp,disabled:!state.gatewayReady || !state.brokerReady || busy==='confirm',kind:state.ipConfirmed?'green':'blue'})
            ),

            React.createElement(Step,{n:6,title:liveAllowed?'Enable Live Trading':'Activate Live Subscription',detail:liveAllowed?'Enable Live only after the broker, paper test and secure connection are ready.':'Your Live trial has ended. Activate a plan to unlock Live Trading.',done:false,active:stage===6,expanded:expanded===6,onPress:()=>toggle(6)},
              React.createElement(Btn,{label:liveAllowed?(busy==='live'?'Enabling Live...':'Enable LIVE Trading'):'Live Trial / Subscription Required',onPress:askEnableLive,disabled:!liveAllowed || !state.ipConfirmed || !state.gatewayReady || !paperAck || busy==='live',kind:'red'}),
              !liveAllowed && paperAllowed ? React.createElement(Text,{style:{color:'#f6c85f',fontSize:11,lineHeight:17,marginTop:8}},'Your 7-day Live trial has ended, but Paper Trading remains available during the 30-day free period. Activate a paid plan to unlock Live again.') : null,
              !liveAllowed ? React.createElement(Btn,{label:'Open Subscription',onPress:()=>openRoute('plans')}) : null
            ),

            error ? React.createElement(View,{style:{marginTop:4,padding:11,borderRadius:10,backgroundColor:'#2a131a',borderWidth:1,borderColor:'#6f2838'}},React.createElement(Text,{style:{color:'#ff9aaa',fontSize:11,lineHeight:17}},error)) : null,
            React.createElement(View,{style:{marginTop:8,padding:12,borderRadius:12,backgroundColor:'#151b29',borderWidth:1,borderColor:'#2d3a50'}},
              React.createElement(Text,{style:{color:'#f6c85f',fontWeight:'900',fontSize:12}},'Safety'),
              React.createElement(Text,{style:{color:'#aebbd0',fontSize:11,lineHeight:17,marginTop:5}},'Real broker orders remain blocked until Live access is active, the broker is connected, the dedicated static-IP gateway is online, the IP is confirmed, and you explicitly enable Live. Starting Paper mode never places real-money orders.')
            )
          ),
          React.createElement(TouchableOpacity,{onPress:load,disabled:loading,style:{marginTop:8,minHeight:46,borderRadius:13,backgroundColor:'#17253a',borderWidth:1,borderColor:'#31557c',alignItems:'center',justifyContent:'center'}},
            loading?React.createElement(ActivityIndicator,{color:'#8bc2ff'}):React.createElement(Text,{style:{color:'#8bc2ff',fontWeight:'900'}},'Refresh Setup Status')
          )
        )
      )
    )
  );
}

module.exports = CustomerOnboardingAssistantV2;
module.exports.default = CustomerOnboardingAssistantV2;
