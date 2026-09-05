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
  const ipText=state.assignedIp || 'Allocation Pending';

  return React.createElement(React.Fragment,null,
    children,
    React.createElement(TouchableOpacity,{onPress:()=>{setExpanded(stage);setOpen(true);},activeOpacity:.86,style:{position:'absolute',right:12,bottom:RN.Platform.OS==='web'?18:86,zIndex:9999,minHeight:46,paddingHorizontal:15,borderRadius:23,backgroundColor:'#0f5ecf',borderWidth:1,borderColor:'#4d9fff',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.35,shadowRadius:8,elevation:14}},
      React.createElement(Text,{style:{color:'#fff',fontWeight:'900',fontSize:12}},'🚀 Set Up Live Trading')
    ),
    React.createElement(Modal,{visible:open,transparent:true,animationType:'slide',onRequestClose:()=>setOpen(false)},
      React.createElement(View,{style:{flex:1,backgroundColor:'rgba(2,7,15,.92)',justifyContent:'flex-end'}},
        React.createElement(View,{style:{maxHeight:'90%',backgroundColor:'#0b1220',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:'#263951',padding:18}},
          React.createElement(View,{style:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}},
            React.createElement(View,{style:{flex:1,minWidth:0,paddingRight:10}},
              React.createElement(Text,{style:{color:'#fff',fontSize:22,fontWeight:'900'}},'Live Trading Setup'),
              React.createElement(Text,{style:{color:'#91a4bd',fontSize:12,marginTop:3}},'Tap any step to open it. The next step\'s status will update automatically.')
            ),
            React.createElement(TouchableOpacity,{onPress:()=>setOpen(false),style:{width:38,height:38,borderRadius:19,backgroundColor:'#172338',alignItems:'center',justifyContent:'center'}},React.createElement(Text,{style:{color:'#fff',fontSize:22}},'×'))
          ),
          React.createElement(View,{style:{flexDirection:'row',gap:8,marginBottom:16}},
            React.createElement(View,{style:{flex:1,padding:11,borderRadius:12,backgroundColor:'#10231f',borderWidth:1,borderColor:'#1e6a55'}},
              React.createElement(Text,{style:{color:'#78deb0',fontSize:11,fontWeight:'900'}},'PAPER ACCESS'),
              React.createElement(Text,{style:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:2}},paperAllowed?`${paperDays} days remaining`:'Expired')
            ),
            React.createElement(View,{style:{flex:1,padding:11,borderRadius:12,backgroundColor:'#122038',borderWidth:1,borderColor:'#315c91'}},
              React.createElement(Text,{style:{color:'#73b8ff',fontSize:11,fontWeight:'900'}},'LIVE ACCESS'),
              React.createElement(Text,{style:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:2}},liveAllowed?(state.ent?.live_access==='trial'?`${liveDays} trial days remaining`:'Active'):'Locked')
            )
          ),
          React.createElement(ScrollView,{contentContainerStyle:{paddingBottom:10},keyboardShouldPersistTaps:'handled'},
            React.createElement(Step,{n:1,title:'Account Created',detail:'Your Option King AI account is ready.',done:true,active:false,expanded:expanded===1,onPress:()=>toggle(1)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'View your profile, registered mobile number or email, and subscription status here.'),
              React.createElement(ActionButton,{label:'Open Account',onPress:()=>openRoute('account')})
            ),
            React.createElement(Step,{n:2,title:'Connect Your Broker',detail:'Choose Angel One or Upstox and complete the API setup.',done:state.brokerReady,active:stage===2,expanded:expanded===2,onPress:()=>toggle(2)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},state.brokerReady?`Broker connected: ${state.selected || 'saved broker'}. You can now test Paper Trading.`:'The Broker Setup page will open. Select your broker, save the required credentials and API details, and verify the connection.'),
              React.createElement(ActionButton,{label:state.brokerReady?'Review Broker':'Connect Broker Now',onPress:()=>openRoute('broker')})
            ),
            React.createElement(Step,{n:3,title:'Test with Paper Trading',detail:'Verify signals, entries, exits, and capital without risking real money.',done:state.brokerReady && paperAllowed,active:stage===3,expanded:expanded===3,onPress:()=>toggle(3)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},paperAllowed?'Open Paper mode and start the bot. Confirm that the setup and status work correctly before switching to Live Trading.':'Your free Paper Trading access has expired. Activate a subscription to continue.'),
              React.createElement(ActionButton,{label:paperAllowed?'Open Paper Bot':'Paper Access Expired',onPress:()=>openRoute('bot'),disabled:!paperAllowed})
            ),
            React.createElement(Step,{n:4,title:'Set Up Secure Connection',detail:state.gatewayReady?'Your dedicated secure connection is ready.':'Your dedicated static-IP connection setup is pending.',done:state.gatewayReady,active:stage===4,expanded:expanded===4,onPress:()=>toggle(4)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'Live API orders will be sent only from the registered static IP. You will not need to keep a phone or Termux running; Option King AI will use a secure server-side connection.'),
              React.createElement(View,{style:{marginTop:10,padding:10,borderRadius:10,backgroundColor:'#0c1725',borderWidth:1,borderColor:'#2a4a6d'}},
                React.createElement(Text,{style:{color:'#7dbdff',fontSize:10,fontWeight:'900'}},'YOUR DEDICATED EXECUTION IP'),
                React.createElement(Text,{style:{color:'#fff',fontSize:15,fontWeight:'900',marginTop:3}},ipText),
                React.createElement(Text,{style:{color:'#91a4bd',fontSize:11,lineHeight:16,marginTop:4}},state.assignedIp?'Register this IP as the Primary Static IP in your broker\'s Developer or My Apps section. The app will verify the match automatically.':'A dedicated IP has not been assigned yet. Once it is provisioned, the exact IP will appear here. Do not register a random or shared IP.')
              ),
              React.createElement(ActionButton,{label:state.gatewayReady?'Connection Ready':'Check Secure Connection',onPress:load})
            ),
            React.createElement(Step,{n:5,title:'Enable Live Trading',detail:'Live Trading can be enabled only after your broker, Live access, and secure connection are ready.',done:state.gatewayReady && liveAllowed,active:stage===5,expanded:expanded===5,onPress:()=>toggle(5)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},liveAllowed?(state.gatewayReady?'All checks are complete. Your confirmation will still be required before Live Trading is enabled.':'Your Live trial is active, but real orders will remain blocked until the secure connection is ready.'):'Live access is locked. Real orders can be enabled only after a trial or subscription is activated.'),
              React.createElement(ActionButton,{label:liveAllowed && state.gatewayReady?'Go to Live Controls':'Live Not Ready',onPress:()=>openRoute('bot'),disabled:!(liveAllowed && state.gatewayReady)})
            ),
            React.createElement(Step,{n:6,title:'Choose a Plan After the Trial',detail:'Live trial: 7 days • Paper Trading: 30 days. A paid plan unlocks both.',done:false,active:stage===6,expanded:expanded===6,onPress:()=>toggle(6)},
              React.createElement(Text,{style:{color:'#b8c6d9',fontSize:12,lineHeight:18}},'After the Live trial ends, you can continue Paper Trading during the 30-day free period. Both features will be available after you activate a paid plan.'),
              React.createElement(ActionButton,{label:'Open Subscription',onPress:()=>openRoute('plans')})
            ),
            React.createElement(View,{style:{marginTop:4,padding:12,borderRadius:12,backgroundColor:'#151b29',borderWidth:1,borderColor:'#2d3a50'}},
              React.createElement(Text,{style:{color:'#f6c85f',fontWeight:'900',fontSize:12}},'Safety Rule'),
              React.createElement(Text,{style:{color:'#aebbd0',fontSize:11,lineHeight:17,marginTop:5}},'Real orders remain blocked until all three checks pass: broker connected, Live access active, and dedicated static-IP connection ready. Live Trading will not start without your confirmation.')
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
