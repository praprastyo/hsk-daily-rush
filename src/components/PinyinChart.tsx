import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2 } from 'lucide-react';
import { playPinyinTone, type PinyinTone } from '../utils/soundSynth';
import { useHaptic } from '../hooks/useHaptic';

// Initials (konsonan) grouped into "periodic" families with their own color.
const INITIAL_GROUPS: { name: string; color: string; initials: string[] }[] = [
  { name: 'Bibir', color: '#FF7B7B', initials: ['b', 'p', 'm', 'f'] },
  { name: 'Lidah', color: '#FFB23E', initials: ['d', 't', 'n', 'l'] },
  { name: 'Tenggorok', color: '#FFD100', initials: ['g', 'k', 'h'] },
  { name: 'Langit', color: '#58CC02', initials: ['j', 'q', 'x'] },
  { name: 'Retrofleks', color: '#1CB0F6', initials: ['zh', 'ch', 'sh', 'r'] },
  { name: 'Desis', color: '#A56EFF', initials: ['z', 'c', 's'] },
  { name: 'Semi-vokal', color: '#FF61C3', initials: ['y', 'w'] },
];

const FINALS = [
  'a', 'o', 'e', 'i', 'u', 'ü',
  'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
  'ie', 'er', 'an', 'en', 'in',
  'ang', 'eng', 'ing', 'ong',
];

// Common hanzi for each valid pinyin combination (initial+final)
const HANZI_MAP: Record<string, string> = {
  // b
  ba: '八', bo: '玻', bi: '笔', bu: '不',
  bai: '白', bei: '北', bao: '包',
  ban: '半', ben: '本', bin: '宾',
  bang: '帮', beng: '崩', bing: '冰',
  // p
  pa: '怕', po: '坡', pi: '皮', pu: '普',
  pai: '拍', pei: '配', pao: '跑', pou: '剖',
  pan: '盘', pen: '盆', pin: '拼',
  pang: '旁', peng: '朋', ping: '平',
  // m
  ma: '妈', mo: '摸', me: '么', mi: '米', mu: '木',
  mai: '买', mei: '没', mao: '猫', mou: '某', miu: '谬',
  man: '满', men: '门', min: '民',
  mang: '忙', meng: '梦', ming: '明',
  // f
  fa: '发', fo: '佛', fu: '父',
  fei: '飞',
  fan: '饭', fen: '分',
  fang: '方', feng: '风',
  // d
  da: '大', de: '的', di: '地', du: '读',
  dai: '代', dei: '得', dui: '对', dao: '到', dou: '都', diu: '丢',
  die: '跌',
  dan: '但', den: '扽', dun: '顿',
  dang: '当', deng: '灯', ding: '丁', dong: '东',
  // t
  ta: '他', te: '特', ti: '体', tu: '土',
  tai: '太', tui: '推', tao: '套', tou: '头',
  tie: '贴',
  tan: '谈', tun: '吞',
  tang: '糖', teng: '疼', ting: '听', tong: '同',
  // n
  na: '那', ne: '呢', ni: '你', nu: '怒', nü: '女',
  nai: '奶', nei: '内', nao: '脑',
  nie: '捏', niu: '牛',
  nan: '难', nen: '嫩', nin: '您',
  nang: '囊', neng: '能', ning: '宁', nong: '农',
  // l
  la: '拉', le: '了', li: '里', lu: '路', lü: '绿',
  lai: '来', lei: '累', lao: '老', lou: '楼', liu: '六',
  lie: '列',
  lan: '蓝', lin: '林',
  lang: '狼', leng: '冷', ling: '零', long: '龙',
  // g
  ga: '嘎', ge: '个', gu: '古',
  gai: '该', gei: '给', gui: '贵', gao: '高', gou: '够',
  gan: '干', gen: '根', gun: '滚',
  gang: '刚', geng: '更', gong: '工',
  // k
  ka: '卡', ke: '可', ku: '苦',
  kai: '开', kei: '尅', kui: '亏', kao: '考', kou: '口',
  kan: '看', ken: '肯', kun: '困',
  kang: '康', keng: '坑', kong: '空',
  // h
  ha: '哈', he: '和', hu: '湖',
  hai: '还', hei: '黑', hui: '回', hao: '好', hou: '后',
  han: '汉', hen: '很', hun: '混',
  hang: '行', heng: '横', hong: '红',
  // j
  ji: '机', ju: '句',
  jia: '家', jie: '姐', jiu: '九',
  jian: '见', jin: '今', jun: '军',
  jiang: '江', jing: '京',
  // q
  qi: '七', qu: '去',
  qia: '恰', qie: '切', qiu: '秋',
  qian: '前', qin: '亲', qun: '群',
  qiang: '强', qing: '青',
  // x
  xi: '西', xu: '许',
  xia: '下', xie: '写', xiu: '秀',
  xian: '先', xin: '新', xun: '寻',
  xiang: '想', xing: '星',
  // zh
  zha: '炸', zhe: '这', zhi: '知', zhu: '猪',
  zhai: '宅', zhei: '这', zhui: '追', zhao: '找', zhou: '周',
  zhan: '站', zhen: '真', zhun: '准',
  zhang: '张', zheng: '正', zhong: '中',
  // ch
  cha: '茶', che: '车', chi: '吃', chu: '出',
  chai: '拆', chui: '吹', chao: '超', chou: '臭',
  chan: '产', chen: '陈', chun: '春',
  chang: '常', cheng: '成', chong: '虫',
  // sh
  sha: '沙', she: '蛇', shi: '十', shu: '书',
  shai: '晒', shui: '水', shao: '少', shou: '手',
  shan: '山', shen: '深', shun: '顺',
  shang: '上', sheng: '生',
  // r
  re: '热', ri: '日', ru: '入',
  rui: '瑞', rao: '绕', rou: '肉',
  ran: '然', ren: '人', run: '润',
  rang: '让', reng: '仍', rong: '容',
  // z
  za: '杂', ze: '则', zi: '子', zu: '组',
  zai: '在', zei: '贼', zui: '最', zao: '早', zou: '走',
  zan: '咱', zen: '怎', zun: '尊',
  zang: '脏', zeng: '增', zong: '总',
  // c
  ca: '擦', ce: '策', ci: '次', cu: '粗',
  cai: '菜', cui: '催', cao: '草', cou: '凑',
  can: '参', cen: '岑', cun: '村',
  cang: '藏', ceng: '层', cong: '从',
  // s
  sa: '撒', se: '色', si: '四', su: '素',
  sai: '赛', sui: '岁', sao: '扫', sou: '搜',
  san: '三', sen: '森', sun: '孙',
  sang: '桑', seng: '僧', song: '送',
  // y
  ya: '牙', yo: '哟', ye: '也', yi: '一', yu: '鱼',
  yao: '要', you: '有',
  yan: '烟', yin: '因', yuan: '元', yun: '云',
  yang: '样', ying: '英', yong: '用',
  // w
  wa: '挖', wo: '我', wu: '五',
  wai: '外', wei: '位',
  wan: '万', wen: '问',
  wang: '王', weng: '翁',
  // er
  er: '二',
};

// Diacritic tables for placing tone marks on the correct vowel.
const TONE_MARKS: Record<string, string[]> = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

// Apply a tone mark (1-4) to a pinyin syllable following standard placement rules.
function applyTone(syllable: string, tone: PinyinTone): string {
  if (tone === 0) return syllable;

  let target = '';
  if (syllable.includes('a')) target = 'a';
  else if (syllable.includes('e')) target = 'e';
  else if (syllable.includes('ou')) target = 'o';
  else {
    // last vowel in the syllable
    for (let i = syllable.length - 1; i >= 0; i--) {
      if ('aoeiuü'.includes(syllable[i])) {
        target = syllable[i];
        break;
      }
    }
  }
  if (!target) return syllable;
  return syllable.replace(target, TONE_MARKS[target][tone]);
}

interface PinyinChartProps {
  open: boolean;
  onClose: () => void;
}

export function PinyinChart({ open, onClose }: PinyinChartProps) {
  const triggerHaptic = useHaptic();
  const [selected, setSelected] = useState<{ initial: string; final: string } | null>(null);

  const syllable = selected ? `${selected.initial}${selected.final}` : '';

  const handleCell = (initial: string, final: string) => {
    setSelected({ initial, final });
    triggerHaptic('light');
    playPinyinTone(1);
  };

  const playTone = (tone: PinyinTone) => {
    triggerHaptic('medium');
    playPinyinTone(tone);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-3xl sm:rounded-3xl sm:my-6 flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden border-2 border-black/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-gray-100 bg-[#FFD100]">
              <div>
                <h2 className="text-xl font-black text-[#111111] leading-none">Tabel Pinyin</h2>
                <p className="text-[11px] font-bold text-[#111111]/60 mt-1">
                  Ketuk sel untuk dengar nada. Baris = konsonan, kolom = vokal.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup tabel pinyin"
                className="bg-white/70 hover:bg-white text-black rounded-full p-2 border-2 border-black/10 active:translate-y-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100">
              {INITIAL_GROUPS.map((g) => (
                <span
                  key={g.name}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-600"
                >
                  <span
                    className="w-3 h-3 rounded-sm border border-black/10"
                    style={{ backgroundColor: g.color }}
                  />
                  {g.name}
                </span>
              ))}
            </div>

            {/* Scrollable periodic grid */}
            <div className="flex-1 overflow-auto p-4">
              <table className="border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white" />
                    {FINALS.map((f) => (
                      <th
                        key={f}
                        className="text-[11px] font-black text-gray-500 px-1 pb-1 min-w-[44px]"
                      >
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_GROUPS.flatMap((group) =>
                    group.initials.map((initial) => (
                      <tr key={initial}>
                        <th
                          className="sticky left-0 z-10 text-sm font-black text-white rounded-lg px-2"
                          style={{ backgroundColor: group.color }}
                        >
                          {initial}
                        </th>
                        {FINALS.map((final) => {
                          const isSel =
                            selected?.initial === initial && selected?.final === final;
                          return (
                            <td key={final} className="p-0">
                              <button
                                onClick={() => handleCell(initial, final)}
                                className={`w-full min-w-[44px] rounded-lg text-[12px] font-bold transition-all border flex flex-col items-center justify-center gap-0 ${
                                  isSel
                                    ? 'ring-2 ring-black scale-105 text-black'
                                    : 'border-black/5 text-gray-700 hover:brightness-95 active:translate-y-0.5'
                                }`}
                                style={{
                                  backgroundColor: isSel
                                    ? group.color
                                    : `${group.color}22`,
                                  minHeight: HANZI_MAP[`${initial}${final}`] ? '40px' : '36px',
                                }}
                              >
                                <span>{initial}{final}</span>
                                {HANZI_MAP[`${initial}${final}`] && (
                                  <span className="text-[10px] font-extrabold opacity-70 leading-none">{HANZI_MAP[`${initial}${final}`]}</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail / tone player */}
            <div className="border-t-2 border-gray-100 p-4 bg-gray-50">
              {selected ? (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#111111] tabular-nums">
                      {syllable}
                    </span>
                    <span className="text-sm font-bold text-gray-400">
                      ketuk nada untuk dengar
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4] as PinyinTone[]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => playTone(tone)}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#FFD100] active:translate-y-0.5 shadow-sm"
                      >
                        <span className="text-lg font-black text-[#111111] leading-none">
                          {applyTone(syllable, tone)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                          Nada {tone}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-sm py-2">
                  <Volume2 className="w-5 h-5" />
                  Pilih kombinasi pinyin di atas untuk memainkan nadanya.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
