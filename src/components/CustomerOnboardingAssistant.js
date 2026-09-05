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

function Step({ n, title, detail, done, active }) {
  const c = done ? '#00d4a0' : active ? '#4d9fff' : '#66758a';
  return React.createElement(View,{style:{flexDirection:'row',gap:12,marginBottom:14}},
    React.createElement(View,{style:{width:30,height:30,borderRadius:15,borderWidth:1,borderColor:c,backgroundColor:c+'20',alignItems:'center',justifyContent:'center'}},
      React.createElement(Text,{style:{color:c,fontWeight:'900'}},done?'✓':String(n))
    ),
    React.createElement(View,{style:{flex:1}},
      React.createElement(Text,{style:{color:'#f2f6ff',fontWeight:'900',fontSize:14}},title),
      React.createElement(Text,{style:{color:'#9aabc2',fontSize:12,lineHeight:18,marginTop:3}},detail)
    )
  );
}

function CustomerOnboardingAssistant({ children }) {
  const [open,setOpen]=React.useState(false);
  const [loading,setLoading]=React.useState(false);
  const [state,setState]=React.useState(null);

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
      setState({isAdmin,ent,brokerReady,selected,gatewayReady,gateway});
    } finally { setLoading(false); }
  },[]);

  React.useEffect(()=>{ load(); const id=setInterval(load,15000); return()=>clearInterval(id); },[load]);
  if (!state || state.isAdmin) return children;

  const liveAllowed=Boolean(state.ent?.live_allowed);
  const paperAllowed=Boolean(state.ent?.paper_allowed);
  const liveDays=state.ent?.live_days_remaining ?? 0;
  const paperDays=state.ent?.paper_days_remaining ?? 0;
  const stage=!state.brokerReady?2:!state.gatewayReady?4:liveAllowed?5:6;

  return React.createElement(React.Fragment,null,
    children,
    React.createElement(TouchableOpacity,{onPress:()=>setOpen(true),activeOpacity:.86,style:{position:'absolute',right:12,bottom:RN.Platform.OS==='web'?18:86,zIndex:9999,minHeight:46,paddingHorizontal:15,borderRadius:23,backgroundColor:'#0f5ecf',borderWidth:1,borderColor:'#4d9fff',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.35,shadowRadius:8,elevation:14}},
      React.createElement(Text,{style:{color:'#fff',fontWeight:'900',fontSize:12}},'🚀 Live Setup')
    ),
    React.createElement(Modal,{visible:open,transparent:true,animationType:'slide',onRequestClose:()=>setOpen(false)},
      React.createElement(View,{style:{flex:1,backgroundColor:'rgba(2,7,15,.92)',justifyContent:'flex-end'}},
        React.createElement(View,{style:{maxHeight:'88%',backgroundColor:'#0b1220',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:'#263951',padding:18}},
          React.createElement(View,{style:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}},
            React.createElement(View,null,
              React.createElement(Text,{style:{color:'#fff',fontSize:22,fontWeight:'900'}},'Live Trading Setup'),
              React.createElement(Text,{style:{color:'#91a4bd',fontSize:12,marginTop:3}},'Naye customer ke liye complete step-by-step setup')
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
          React.createElement(ScrollView,{contentContainerStyle:{paddingBottom:10}},
            React.createElement(Step,{n:1,title:'Account created',detail:'Email/mobile se Option King AI account bana kar login karein.',done:true,active:false}),
            React.createElement(Step,{n:2,title:'Connect your broker',detail:'Broker section me Angel One ya Upstox choose karke apne broker credentials/API details save karein.',done:state.brokerReady,active:stage===2}),
            React.createElement(Step,{n:3,title:'Test in Paper first',detail:'Paper mode me bot start karke signal, trade entry/exit aur capital display verify karein. Real money use nahi hota.',done:state.brokerReady && paperAllowed,active:stage===3}),
            React.createElement(Step,{n:4,title:'Secure Live Connection',detail:state.gatewayReady?'Secure execution connection ready hai. Customer ko IP/token/Termux handle nahi karna padega.':'Secure fixed-IP execution connection abhi ready nahi hai. App/server status automatically check karega; technical details customer se hidden rahenge.',done:state.gatewayReady,active:stage===4}),
            React.createElement(Step,{n:5,title:'Enable Live',detail:'Live access + broker + secure connection ready hone par hi Live enable karein. Confirmation ke bina real order place nahi hoga.',done:state.gatewayReady && liveAllowed,active:stage===5}),
            React.createElement(Step,{n:6,title:'Subscription when trial ends',detail:'Live 7-day trial ke baad Live lock hoga; Paper registration se 30 days tak chalega. Paid plan Paper + Live dono unlock karta hai.',done:false,active:stage===6}),
            React.createElement(View,{style:{marginTop:4,padding:12,borderRadius:12,backgroundColor:'#151b29',borderWidth:1,borderColor:'#2d3a50'}},
              React.createElement(Text,{style:{color:'#f6c85f',fontWeight:'900',fontSize:12}},'Important'),
              React.createElement(Text,{style:{color:'#aebbd0',fontSize:11,lineHeight:17,marginTop:5}},'Live Trading tab/enable button tab tak Ready nahi dikhna chahiye jab tak broker connection, Live entitlement aur secure execution connection teenon ready na hon. Real order ke liye explicit customer confirmation required rahega.')
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
