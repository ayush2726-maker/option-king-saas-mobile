const React = require('react');
const RN = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } = RN;
const API = 'https://option-king-saas-production.up.railway.app';

async function token() {
  for (const key of ['saas_token','token','auth_token','okai_token','access_token']) {
    try { const v = await AsyncStorage.getItem(key); if (v && String(v).length > 20) return String(v); } catch (_) {}
  }
  return '';
}
async function get(path, t) {
  const r = await fetch(API + path + (path.includes('?') ? '&' : '?') + '_ts=' + Date.now(), {
    headers: { Authorization: 'Bearer ' + t, 'Cache-Control': 'no-cache' },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.detail || d?.message || 'Request failed');
  return d;
}

function nav(route) {
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__OKAI_WEB_NAVIGATE__ === 'function') {
      return Boolean(globalThis.__OKAI_WEB_NAVIGATE__(route));
    }
  } catch (_) {}
  return false;
}

function Step({ n, title, detail, done, active, expanded, onPress, children }) {
  const c = done ? '#00d4a0' : active ? '#4d9fff' : '#66758a';
  return React.createElement(View,{style:{marginBottom:10}},
    React.createElement(TouchableOpacity,{onPress,activeOpacity:.82,style:{flexDirection:'row',gap:12,paddingVertical:7,paddingHorizontal:2,borderRadius:12}},
      React.createElement(View,{style:{width:34,height:34,borderRadius:17,borderWidth:1,borderColor:c,backgroundColor:c+'20',alignItems:'center',justifyContent:'center'}},
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
    expanded ? React.createElement(View,{style:{marginLeft:46,marginTop:3,marginBottom:8,padding:12,borderRadius:12,backgroundColor:'#111c2c',borderWidth:1,borderColor:'#263d5b'}},children) : null
  );
}

function ActionButton({label,onPress,disabled}) {
  return React.createElement(TouchableOpacity,{onPress,disabled,activeOpacity:.84,style:{marginTop:10,minHeight:42,borderRadius:11,backgroundColor:disabled?'#202a39':'#174c85',borderWidth:1,borderColor:disabled?'#39465a':'#3d82c4',alignItems:'center',justifyContent:'center',paddingHorizontal:12}},
    React.createElement(Text,{style:{color:disabled?'#77859a':'#d9ecff',fontWeight:'900',fontSize:12}},label)
  );
}

function CustomerOnboardingAssistant({ children }) {
  const [open,setOpen]=React.useState(false);
  const [loading,setLoading]=React.useState(false);
  const [state,setState]=React.useState(null);
  const [expanded,setExpanded]=React.useState(2);

  const load=React.useCallback(async()=>{
    const t=await token();
    if(!t){ setState(null); return; }
    setLoading(true);
    try {
      const [me,ent,brokers,gateway]=await Promise.all([
        get('/auth/me',t).catch(()=>({})),
        get('/subscription/entitlements',t).catch(()=>({})),
        get('/broker/list',t).catch(()=>({})),
        get('/local-gateway/status',t).catch(()=>({})),
      ]);
      const user=me?.user || me || {};
      const isAdmin=Boolean(user?.is_admin);
      const saved=Array.isArray(brokers?.brokers)?brokers.brokers:[];
      const selected=String(brokers?.selected_broker||'').toLowerCase();
      const brokerReady=Boolean(selected || saved.length);
      const gatewayReady=Boolean(gateway?.paired && gateway?.online && (gateway?.static_ip_matches !== false));
      const assignedIp=String(gateway?.expected_static_ip || '').trim();
      setState({isAdmin,ent,brokerReady,selected,gatewayReady,gateway,assignedIp});
    } finally { setLoading(false); }
  },[]);

  React.useEffect(()=>{ load(); const id=setInterval(load,15000); return()=>clearInterval(id); },[load]);
  if (!state || state.isAdmin) return children;

  const liveAllowed=Boolean(state.ent?.live_allowed);
  const paperAllowed=Boolean(state.ent?.paper_allowed);
  const liveDays=state.ent?.live_days_remaining ?? 0;
  const paperDays=state.ent?.paper_days_remaining ?? 0;
  const stage=!state.brokerReady?2:!state.gatewayReady?4:liveAllowed?5:6;

  const openRoute=(route)=>{ setOpen(false); setTimeout(()=>nav(route),80); };
  const toggle=(n)=>setExpanded(v=>v===n?0:n);
  const ipText=state.assignedIp || 'Allocation pending';

  return React.createElement(React.Fragment,null,
    children,
    React.createElement(TouchableOpacity,{onPress:()=>{setExpanded(stage);setOpen(true);},activeOpacity:.86,style:{position:'absolute',right:12,bottom:RN.Platform.OS==='web'?18:86,zIndex:9999,minHeight:46,paddingHorizontal:15,borderRadius:23,backgroundColor:'#0f5ecf',borderWidth:1,borderColor:'#4d9fff',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.35,shadowRadius:8,elevation:14}},
      React.createElement(Text,{style:{color:'#fff',fontWeight:'900',fontSize:12}},'🚀 Live Setup')
    ),
    React.createElement(Modal,{visible:open,transparent:true,animationType:'slide',onRequestClose:()=>setOpen(false)},
      React.createElement(View,{style:{flex:1,backgroundColor:'rgba(2,7,15,.92)',justifyContent:'flex-end'}},
        React.createElement(View,{style:{maxHeight:'90%',backgroundColor:'#0b1220',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:'#263951',padding:18}},
          React.createElement(View,{style:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}},
            React.createElement(View,{style:{flex:1,minWidth:0,paddingRight:10}},
              React.createElement(Text,{style:{color:'#fff',fontSize:22,fontWeight:'900'}},'Live Trading Setup'),
              React.createElement(Text,{style:{color:'#91a4bd',fontSize:12,marginTop:3}},'Har step par tap karein — wahi process open hoga aur next step status automatically update hoga.')
            ),
            React.createElement(TouchableOpacity,{onPress:()=>setOpen(false),style:{width:38,height:38,borderRadius:19,backgroundColor:'#172338',alignItems:'center',justifyContent:'center'}},React.createElement(Text,{style:{color:'#fff',fontSize:22}},'×'))
          ),
          React.createElement(View,{style:{flexDirection:'row',gap:8,marginBottom:16}},
            React.createElement(View,{style:{flex:1,padding:11,borderRadius:12,backgroundColor:'#10231f',borderWidth:1,borderColor:'#1e6a55'}},
              React.createElement(Text,{style:{color:'#78deb0',fontSize:11,fontWeight:'900'}},'PAPER FREE'),
              React.createElement(Text,{style:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:2}},paperAllowed?`${paperDays} days left`:'Expired')
            ),
            React.createElement(View,{style:{flex:1,padding:11,borderRadius:12,backgroundColor:'#122038',borderWidth:1,borderColor:'#315c91'}},
              React.createElement(Text,{style:{color:'#73b8ff',fontSize:11,fontWeight:'900'}},'LIVE ACCESS'),
              React.createElement(Text,{style:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:2}},liveAllowed?(state.ent?.live_access==='trial'?`${liveDays} days trial`:'Active'):'Locked')
            )
          ),
          React.createElement(ScrollView,{contentContainerStyle:{paddingBottom:10},keyboardShouldPersistTaps:'handled'},
            React.createElement(Step,{n:1,title:'Account created',detail:'Option King AI account aur login.',done:true,active:false,expanded:expanded===1,onPress:()=>toggle(1)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'Account ready hai. Yahan profile, mobile/email aur subscription status check kar sakte hain.'),
              React.createElement(ActionButton,{label:'Open Account',onPress:()=>openRoute('account')})
            ),
            React.createElement(Step,{n:2,title:'Connect your broker',detail:'Angel One ya Upstox choose karke broker/API setup complete karein.',done:state.brokerReady,active:stage===2,expanded:expanded===2,onPress:()=>toggle(2)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},state.brokerReady?`Broker connected: ${state.selected || 'saved broker'}. Ab Paper test karein.`:'Broker page khulega. Customer broker select karke required credentials/API details save karega; app connection status verify karega.'),
              React.createElement(ActionButton,{label:state.brokerReady?'Review Broker':'Connect Broker Now',onPress:()=>openRoute('broker')})
            ),
            React.createElement(Step,{n:3,title:'Test in Paper first',detail:'Real money ke bina signal, entry/exit aur capital display verify karein.',done:state.brokerReady && paperAllowed,active:stage===3,expanded:expanded===3,onPress:()=>toggle(3)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},paperAllowed?'Paper mode open karke Bot Start karein. Kam se kam setup/status verify hone ke baad hi Live par jayein.':'Paper free access expire ho chuka hai; subscription activate karna hoga.'),
              React.createElement(ActionButton,{label:paperAllowed?'Open Paper Bot':'Paper Access Expired',onPress:()=>openRoute('bot'),disabled:!paperAllowed})
            ),
            React.createElement(Step,{n:4,title:'Secure Live Connection',detail:state.gatewayReady?'Dedicated secure execution connection ready hai.':'Dedicated static-IP execution setup pending hai.',done:state.gatewayReady,active:stage===4,expanded:expanded===4,onPress:()=>toggle(4)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'Live API orders registered static IP se hi jayenge. Customer ko phone/Termux chalane ki zarurat nahi honi chahiye; Option King AI server-side execution connection use karega.'),
              React.createElement(View,{style:{marginTop:10,padding:10,borderRadius:10,backgroundColor:'#0c1725',borderWidth:1,borderColor:'#2a4a6d'}},
                React.createElement(Text,{style:{color:'#7dbdff',fontSize:10,fontWeight:'900'}},'YOUR DEDICATED EXECUTION IP'),
                React.createElement(Text,{style:{color:'#fff',fontSize:15,fontWeight:'900',marginTop:3}},ipText),
                React.createElement(Text,{style:{color:'#91a4bd',fontSize:11,lineHeight:16,marginTop:4}},state.assignedIp?'Isi IP ko broker Developer/My Apps me Primary Static IP ke roop me register karein. App matching automatically verify karega.':'IP abhi assign nahi hua hai. Jab server-side dedicated IP provision hoga tab yahin exact IP dikhega; random/shared IP use nahi karna hai.')
              ),
              React.createElement(ActionButton,{label:state.gatewayReady?'Connection Ready':'Check Secure Connection',onPress:load})
            ),
            React.createElement(Step,{n:5,title:'Enable Live',detail:'Live access + broker + dedicated secure connection ready hone par hi enable hoga.',done:state.gatewayReady && liveAllowed,active:stage===5,expanded:expanded===5,onPress:()=>toggle(5)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},liveAllowed?(state.gatewayReady?'Sab checks ready hain. Live enable karne se pehle explicit customer confirmation required rahega.':'Live trial active hai, lekin secure connection ready hone tak real orders blocked rahenge.'):'Live access locked hai. Trial/subscription active hone par hi real orders enable honge.'),
              React.createElement(ActionButton,{label:liveAllowed && state.gatewayReady?'Go to Live Controls':'Live Not Ready',onPress:()=>openRoute('bot'),disabled:!(liveAllowed && state.gatewayReady)})
            ),
            React.createElement(Step,{n:6,title:'Subscription when trial ends',detail:'7-day Live trial; Paper 30 days. Paid plan Paper + Live unlock karta hai.',done:false,active:stage===6,expanded:expanded===6,onPress:()=>toggle(6)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'Live trial khatam hone par Paper 30-day window ke andar continue kar sakta hai. Paid activation ke baad dono access active ho jayenge.'),
              React.createElement(ActionButton,{label:'Open Subscription',onPress:()=>openRoute('plans')})
            ),
            React.createElement(View,{style:{marginTop:4,padding:12,borderRadius:12,backgroundColor:'#151b29',borderWidth:1,borderColor:'#2d3a50'}},
              React.createElement(Text,{style:{color:'#f6c85f',fontWeight:'900',fontSize:12}},'Safety rule'),
              React.createElement(Text,{style:{color:'#aebbd0',fontSize:11,lineHeight:17,marginTop:5}},'Broker connected + Live entitlement + dedicated static-IP connection ready — teenon checks ke bina real order block rahega. Customer confirmation ke bina Live arm nahi hoga.')
            )
          ),
          React.createElement(TouchableOpacity,{onPress:load,disabled:loading,style:{marginTop:10,minHeight:46,borderRadius:13,backgroundColor:'#17253a',borderWidth:1,borderColor:'#31557c',alignItems:'center',justifyContent:'center'}},loading?React.createElement(ActivityIndicator,{color:'#8bc2ff'}):React.createElement(Text,{style:{color:'#8bc2ff',fontWeight:'900'}},'Refresh Setup Status'))
        )
      )
    )
  );
}

module.exports = CustomerOnboardingAssistant;
module.exports.default = CustomerOnboardingAssistant;
