<?php
while(ob_get_level()){ob_end_clean();}
ini_set('memory_limit','512M');set_time_limit(120);ignore_user_abort(true);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store, no-cache, must-revalidate');
$support_gz = isset($_SERVER['HTTP_ACCEPT_ENCODING']) && strpos($_SERVER['HTTP_ACCEPT_ENCODING'],'gzip') !== false;
define('AES_KEY','1234123412ABCDEF');define('AES_IV','ABCDEF1234123412');
define('API_URL','https://h.app.coc.10086.cn/website/nrapigate/nrtariff/new/Tariff/getTariffListInfo');
define('PAGE_URL','https://h.app.coc.10086.cn/cmcc-app/pc-pages/tariffZonePers.html?pageId=834148205904408576&prov=731&channelId=P00000010677');
$PROV_CODE=['quanguo'=>'731','hunan'=>'731','hubei'=>'27','guangdong'=>'20','jiangsu'=>'25','zhejiang'=>'571','shandong'=>'531','henan'=>'371','sichuan'=>'28','fujian'=>'591','anhui'=>'551','hebei'=>'311','shanxi'=>'351','neimenggu'=>'471','liaoning'=>'24','jilin'=>'431','heilongjiang'=>'451','jiangxi'=>'791','guangxi'=>'771','hainan'=>'898','guizhou'=>'851','yunnan'=>'871','xizang'=>'891','shaanxi'=>'29','gansu'=>'931','qinghai'=>'971','ningxia'=>'951','xinjiang'=>'991','beijing'=>'10','shanghai'=>'21','tianjin'=>'22','chongqing'=>'23'];
$PROV_NAME=['quanguo'=>'全网','anhui'=>'安徽','beijing'=>'北京','chongqing'=>'重庆','fujian'=>'福建','gansu'=>'甘肃','guangdong'=>'广东','guangxi'=>'广西','guizhou'=>'贵州','hainan'=>'海南','hebei'=>'河北','heilongjiang'=>'黑龙江','henan'=>'河南','hubei'=>'湖北','hunan'=>'湖南','jiangsu'=>'江苏','jiangxi'=>'江西','jilin'=>'吉林','liaoning'=>'辽宁','neimenggu'=>'内蒙古','ningxia'=>'宁夏','qinghai'=>'青海','shaanxi'=>'陕西','shandong'=>'山东','shanghai'=>'上海','shanxi'=>'山西','sichuan'=>'四川','tianjin'=>'天津','xinjiang'=>'新疆','xizang'=>'西藏','yunnan'=>'云南','zhejiang'=>'浙江'];
function aes_enc($d){$p=16-(strlen($d)%16);$d.=str_repeat(chr($p),$p);return strtoupper(bin2hex(openssl_encrypt($d,'AES-128-CBC',AES_KEY,OPENSSL_RAW_DATA|OPENSSL_ZERO_PADDING,AES_IV)));}
function aes_dec($h){$r=openssl_decrypt(hex2bin($h),'AES-128-CBC',AES_KEY,OPENSSL_RAW_DATA|OPENSSL_ZERO_PADDING,AES_IV);$p=ord($r[strlen($r)-1]);if($p>=1&&$p<=16)$r=substr($r,0,-$p);return $r;}
function fetch_cat($pc,$ta,$t1,$t2){
$p=['cellNum'=>'99999999999','province'=>$pc,'isPublic'=>'1','linkScn'=>'1','tariffAttr'=>$ta,'type1'=>$t1,'type2'=>$t2,'page'=>1,'limit'=>10000,'xk'=>sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',mt_rand(0,65535),mt_rand(0,65535),mt_rand(0,65535),mt_rand(0,4095)|16384,mt_rand(0,16383)|32768,mt_rand(0,65535),mt_rand(0,65535),mt_rand(0,65535))];
$ch=curl_init();curl_setopt_array($ch,[CURLOPT_URL=>API_URL,CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>aes_enc(json_encode($p,JSON_UNESCAPED_UNICODE)),CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>60,CURLOPT_SSL_VERIFYPEER=>false,CURLOPT_SSL_VERIFYHOST=>false,CURLOPT_HTTPHEADER=>['User-Agent: Mozilla/5.0','Referer: '.PAGE_URL,'Accept: application/json','Content-Type: application/json; charset=UTF-8']]);
$r=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
if($c!==200||!$r)return['error'=>'fail'];$d=json_decode($r,true);if(!$d||empty($d['body']))return['error'=>'fmt'];
return json_decode(aes_dec($d['body']),true);
}
function map_f($nm){
$t1=isset($nm['type1'])?(string)$nm['type1']:'1';$t2=isset($nm['type2'])?(string)$nm['type2']:'1';
$t1c=['1'=>'个人资费','2'=>'政企资费'];$t2c=['1'=>'套餐','2'=>'加装包','3'=>'营销活动'];
$fees=isset($nm['fees'])?trim($nm['fees']):'';$fu=isset($nm['feesUnit'])?trim($nm['feesUnit']):'';
$call=isset($nm['call'])?trim($nm['call']):'';$dv=isset($nm['data'])?trim($nm['data']):'';$du=isset($nm['dataUnit'])?trim($nm['dataUnit']):'';
$sms=isset($nm['sms'])?trim($nm['sms']):'';$ot=isset($nm['orientTraffic'])?trim($nm['orientTraffic']):'';$otu=isset($nm['orientTrafficUnit'])?trim($nm['orientTrafficUnit']):'';
$od=isset($nm['onlineDay'])?trim($nm['onlineDay']):'';$fd=isset($nm['offineDay'])?trim($nm['offineDay']):'';
$fmt=function($s){if(strlen($s)===8&&ctype_digit($s))return intval(substr($s,0,4)).'年'.intval(substr($s,4,2)).'月'.intval(substr($s,6,2)).'日';return $s;};
$oc=isset($nm['otherContent'])?trim($nm['otherContent']):'';
if((!$sms||$sms==='0'||$sms==='null')&&preg_match('/短信\s*(\d+)\s*条/',$oc,$m))$sms=$m[1];
$f=['资费标准'=>$fees.$fu,'方案编号'=>isset($nm['reportNo'])?trim($nm['reportNo']):(isset($nm['goodsid'])?trim($nm['goodsid']):''),'资费类型'=>isset($t2c[$t2])?$t2c[$t2]:'套餐','归属'=>isset($t1c[$t1])?$t1c[$t1]:'个人资费','适用范围'=>isset($nm['applicablePeople'])?trim($nm['applicablePeople']):'','适用地区'=>isset($nm['applicableArea'])?trim($nm['applicableArea']):'','销售渠道'=>isset($nm['channel'])?trim($nm['channel']):'','上线日期'=>$fmt($od),'下线日期'=>$fmt($fd),'有效期限'=>isset($nm['validPeriod'])?trim($nm['validPeriod']):'','在网要求'=>isset($nm['duration'])?trim($nm['duration']):'','退订方式'=>isset($nm['unsubscribe'])?trim($nm['unsubscribe']):'','违约责任'=>isset($nm['responsibility'])?trim($nm['responsibility']):'','国内通话'=>$call?($call.'分钟'):'','国内通用流量'=>$dv.$du,'短信'=>($sms&&$sms!=='0'&&$sms!=='null')?($sms.'条'):'','定向流量'=>$ot.$otu,'宽带'=>isset($nm['brandwidth'])?trim($nm['brandwidth']):'','移动高清'=>isset($nm['iptv'])?trim($nm['iptv']):'','权益'=>isset($nm['rights'])?trim($nm['rights']):'','超出资费说明'=>isset($nm['extraFees'])?trim($nm['extraFees']):'','其他服务内容'=>$oc,'其他说明'=>isset($nm['others'])?trim($nm['others']):''];
return array_filter($f,function($v){return $v!==''&&$v!==null;});
}
function get_items($sec){
global $PROV_CODE;$pc=isset($PROV_CODE[$sec])?$PROV_CODE[$sec]:'731';$ta=($sec==='quanguo')?'1':'2';
$items=[];foreach([['1','1'],['1','2'],['1','3'],['2','1'],['2','2'],['2','3']] as $c){
$r=fetch_cat($pc,$ta,$c[0],$c[1]);if(isset($r['error']))continue;
foreach(isset($r['data']['beans'])?$r['data']['beans']:[] as $b){foreach(isset($b['nonModuleList'])?$b['nonModuleList']:[] as $nm){
$n=isset($nm['name'])?trim($nm['name']):'';if($n&&!isset($items[$n]))$items[$n]=['name'=>$n,'fields'=>map_f($nm)];}}
usleep(200000);}
return array_values($items);
}
function out($data){
global $support_gz;
$json=json_encode($data,JSON_UNESCAPED_UNICODE);
if($support_gz){$gz=gzencode($json,9);header('Content-Encoding: gzip');header('Content-Length: '.strlen($gz));echo $gz;}
else{header('Content-Length: '.strlen($json));echo $json;}
exit;
}
$action=isset($_GET['action'])?$_GET['action']:'section';$section=isset($_GET['section'])?preg_replace('/[^a-z]/','',$_GET['section']):'beijing';
$cdir=__DIR__.'/cache';if(!is_dir($cdir))mkdir($cdir,0755,true);
$cf=$cdir.'/'.$action.'_'.$section.'.json';$ttl=1800;
if(file_exists($cf)&&(time()-filemtime($cf)<$ttl)){
$json=file_get_contents($cf);
if($support_gz){$gz=gzencode($json,9);header('Content-Encoding: gzip');header('Content-Length: '.strlen($gz));echo $gz;}
else{header('Content-Length: '.strlen($json));echo $json;}
exit;
}
switch($action){
case 'section':$items=get_items($section);$result=['timestamp'=>date('Y-m-d H:i:s'),'section'=>$section,'error'=>null,'items'=>$items,'total'=>count($items),'_source'=>'官方API实时查询'];
file_put_contents($cf,json_encode($result,JSON_UNESCAPED_UNICODE));out($result);break;
case 'latest':$sf=__DIR__.'/data/latest.json';$sd=file_exists($sf)?json_decode(file_get_contents($sf),true):null;
if($sd&&isset($sd['sections'])){$result=$sd;$result['default']='beijing';$result['_source']='统计缓存，明细实时查询';}else{
$secs=[];foreach($GLOBALS['PROV_NAME'] as $sid=>$sname)$secs[]=['section'=>$sid,'name'=>$sname,'total'=>0];
$result=['updated'=>date('Y-m-d H:i:s'),'default'=>'beijing','sections'=>$secs,'quanguo_total'=>0,'prov_total'=>0,'prov_dist'=>new stdClass(),'prov_stats'=>['hunan'=>['total'=>0,'personal'=>0,'gq'=>0,'dist'=>new stdClass()]],'hunan_total'=>0,'dist'=>new stdClass(),'def_dist'=>['套餐'=>0,'加装包'=>0,'营销活动'=>0],'_source'=>'官方API实时查询'];}
file_put_contents($cf,json_encode($result,JSON_UNESCAPED_UNICODE));out($result);break;
case 'clear_cache':$files=glob($cdir.'/*.json');foreach($files as $f)unlink($f);out(['success'=>true,'cleared'=>count($files)]);break;
default:out(['error'=>'未知操作']);
}