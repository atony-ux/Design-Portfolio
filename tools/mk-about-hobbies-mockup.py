import re
s=open('about.html',encoding='utf-8').read()
s=re.sub(r'(src|href)="(?!https?:|mailto:|#|\.\./)([^"]+)"', lambda m: m.group(1)+'="../'+m.group(2)+'"', s)
s=re.sub(r'\s*<!-- GSAP \+ ScrollTrigger.*?</script>\s*<script src="https://cdnjs[^>]*></script>\s*<script src="\.\./js/main\.js[^>]*></script>','',s,flags=re.S)
s=re.sub(r'<script src="\.\./assets/vendor/drawably/drawably\.classic\.js[^>]*></script>','',s)
a=s.index('        <div class="ab-comms">'); b=s.index('      </div>\n    </section>',a)
s=s[:a]+s[b:]
# LinkedIn goes
st=s.index('<div class="pg-it ab-it ab-it--apps"'); i=s.rfind('\n',0,st); j=s.rfind('\n',0,i)
if '<!--' in s[j:i]: i=j
k=s.index('\n          </div>\n',st)+len('\n          </div>\n'); s=s[:i]+'\n'+s[k:]
POS={
 'ab-it--me':     'left:0;top:36px;width:224px;rotate:-3deg',
 'ab-it--music':  'left:256px;top:0;width:208px;rotate:2.5deg',
 'ab-it--strava': 'left:492px;top:28px;width:148px;rotate:4deg',
 'ab-it--now':    'left:484px;top:232px;width:156px;rotate:-3deg',
 'ab-it--artist': 'left:258px;top:218px;width:206px;rotate:-2deg',
 'ab-it--evo':    'left:12px;top:396px;width:212px;rotate:4deg',
 'ab-it--stack':  'left:248px;top:438px',
}
for cls,style in POS.items():
    s,n=re.subn(r'(class="pg-it ab-it '+cls+r'" style=")[^"]*(")', lambda m: m.group(1)+style+m.group(2), s); assert n==1, cls
s=s.replace('style="left:-72px;top:-36px;width:152px;rotate:-10deg"','style="left:-72px;top:-36px;width:152px;rotate:-10deg"')

G='../assets/graphics/hobbies/'
gear='''
          <!-- MOCKUP: the OP-1 (dream gear), overlapping the Atony card so the music pieces read as one group -->
          <div class="pg-it ab-it ab-gear ab-gear--op1" style="left:246px;top:308px;width:222px;rotate:-3deg">
            <img src="'''+G+'''op-1.webp" alt="Teenage Engineering OP-1" width="733" height="260" />
            <span class="ab-gear__tag">dream gear ✶</span>
          </div>
'''
anchor='          <!-- playing -->'
assert anchor in s; s=s.replace(anchor,gear+'\n'+anchor,1)
stick='''
          <!-- MOCKUP: my leverless controller, under the EVO photo -->
          <div class="pg-it ab-it ab-gear ab-gear--stick" style="left:-22px;top:592px;width:204px;rotate:5deg"><img src="'''+G+'''leverless.webp" alt="My signed leverless fight stick" width="900" height="439" /></div>
'''
anchor='          <!-- opens the photo gallery -->'
assert anchor in s; s=s.replace(anchor,stick+'\n'+anchor,1)
css='''
<style>
/* ===== MOCKUP ONLY (move into style.css once approved) ===== */
.mock-note { position: fixed; left: 16px; bottom: 16px; z-index: 300; background: var(--ink); color: #fff; font-size: 12px; padding: 6px 10px; }
.ab-gear img { display: block; width: 100%; height: auto; filter: drop-shadow(0 8px 12px rgba(16,16,40,.16)); }
/* the controller photo has its own bright, contrasty lighting: soften it so it sits on the page like the paper pieces */
.ab-gear--stick img { filter: saturate(.8) contrast(.9) brightness(1.04) drop-shadow(0 8px 12px rgba(16,16,40,.14)); }
.ab-gear__tag { position: absolute; right: 4px; bottom: -26px; font-family: var(--hand); font-size: 22px; font-weight: 700;
  color: var(--blue); rotate: -4deg; white-space: nowrap; }
</style>
<div class="mock-note">Mockup v3: original layout, music group (player + Atony + OP-1), smaller leverless, LinkedIn + speakers removed</div>
'''
s=s.replace('</body>', css+'\n</body>',1)
s=s.replace('<title>Anthony Nguyen -- Portfolio</title>','<title>About Hobby Widgets Mockup</title>')
open('mockups/about-hobbies.html','w',encoding='utf-8').write(s)
print('ok')
