// Ideal extension: zero-duration, lossless bottom velocity reversal.
// This is an explicit boundary rule, not a model of string elasticity or impact.
export function idealState(t,p,loop=true){
 const td=p.end,h=.16,a=p.a,r=p.r;
 const cycle=loop?Math.floor(t/(2*td)):0;
 const local=loop?t-cycle*2*td:Math.min(t,td);
 const up=local>td,u=up?local-td:local,vb=a*td;
 const y=up?h-vb*u+.5*a*u*u:.5*a*u*u;
 const v=up?-vb+a*u:a*u;
 const sign=cycle%2===0?1:-1;
 const travel=up?h+vb*u-.5*a*u*u:y;
 const theta=(cycle%2===0?0:2*h/r)+sign*travel/r;
 return {y,v,omega:sign*Math.abs(v)/r,theta,cycle,up,local};
}
