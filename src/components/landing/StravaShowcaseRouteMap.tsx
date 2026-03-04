"use client";

import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("@/components/strava/RouteMap"), {
  ssr: false,
  loading: () => (
    <div
      className="animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
      style={{ height: 300 }}
    />
  ),
});

/**
 * Iloilo–Miag-ao Coastal Road — the most popular cycling route in Iloilo.
 * Road-snapped polyline from OSRM routing engine (~50 km one-way along the coast).
 * Displayed as a 110 km out-and-back cycling route.
 */
const COASTAL_ROAD_POLYLINE =
  "ggh`AqiakVuB?H|A@B?HHfA@P@FHbA@J@LVbDBb@@\\Db@XhEB\\FbBFpAD~@@\\@H@n@FdA@`@Bf@@L?@T`F@LFpA@J?PHtA?P@L@RDjA@RM@aERG?kEXU@IBSD]Jk@NYHSD[DI@G@SBB\\?HDn@J|A@JBZFz@Db@@DBFB^@VHfADz@@J@VF|@L`C@FTbDDz@BP?R@P^~DBPBXHt@DZDf@@P@BFn@Hx@DT@DLz@VbBBL\\fAj@zA^z@d@hAFJ\\t@R`@N\\JTHRRb@FRBDFLDLHPj@tAZj@NXFLbAjBd@z@^r@~AfD~AzCbA~ApDhG`@r@r@jAh@|@v@rAWNSRqBhAOFUJQHaAjAc@Vn@dAHPDHDDFBBH?H@JBVBNFNDHHLDJMXGPEd@@LBJ@HF@JFp@r@oB|AA@?B?Bj@bA^x@??DBB?B?hCqB{@_Au@w@q@s@KGGAAICKAMDe@FQLYEKIMEIGOCOCWAK?ICIGCEEEIIQo@eAb@W`AkAPITKNGpBiAVKXOJPPXT\\\\h@v@nAr@xAdA`Cz@pB`AjD\\hAl@nBNb@J`@v@pBTl@DH@BFPh@rAZt@L`@JVn@pBHXJb@Nx@D\\TpBF~@?FATAHEf@LBPLv@dGDt@PnAt@hFBPh@bEJxAB`@Bd@?@Fx@XdFDj@Fx@Bn@@VB^`@`HPtDLFbGo@l@EtCMh@CF?dAEdBIdDOb@Cj@Ad@CH?xCS~@E`BI|@E@`@DlC@l@?Z@rD@p@@rAHjFJzE?zA@tC?TDdBB`AHrBHfEBrA@f@@jA?\\?LBfCDfC?z@@jBAfAAPCjAARI`CAJEd@Kz@MpAI`AKfAMpAE`@W~BO~@YdC?F_@jBK`@GRUn@Up@O^i@rA_@~@Ul@_ArB]x@S`@_@z@w@pBGRe@tAu@tBUh@}@vBYr@ADuAnDaA|BOGeFyAi@SeA_@_Cy@KG_@]}AkAgBzD}AjFn@\\h@X`@Tj@\\_AdBi@~@k@[c@WYOIGDI~A}Co@]iBfGOd@Kb@CFW|@]dAcBzFW|@a@xAoB|FeB`GaE~NSp@Qh@IVyAtEfAd@hAf@HH?XOv@Mj@IXCNARDDJFJFTHh@R~Al@\\LTFNHFL@N?XAn@AHE`AAZIfFChAA\\GlBCnF?~@?VB`CAnA?x@BdA?B@\\@z@Bn@@JD`A@\\Bf@@ZBfBB^@PBv@HhAHbDBf@DjBB^@`@Br@FhADf@?VBfAHnA?fABj@PrH@l@FxE@Z?~A@r@CdBAVCv@AhA?h@?\\D\\BRL|@DXN`Ab@tDVnC^zEFXFVFXFLnAfEFTZ`B@LBN@\\FlBDpBDr@LbATdAb@bBFR@DLf@R`AJv@ZtCt@Kz@QnA]PCr@Cp@C??q@Bs@BQBoA\\{@Pu@JD\\DXr@vGPnAZvAJl@b@lCXzA|@xEZnBj@hD`@xBNf@XdA^rA~DvNV`ARr@tBvHT`AJ~@BfA@vD?vB?~@@^@jB@rB?p@BhADz@PbA`BbHTx@Vz@`CpIFPDPFh@@R?`@AfI?tA@`H?f@AhDAx@@|JJxAbBbOh@rED`@T~AZjAHTf@xAlA~BdCtEdA`Cl@bB@BZbBRbAt@pEPdAd@lBh@bBx@dBbApBJRjBtDrBsBhEqC??iEpCsBrBt@vAj@dAZj@rB~DXj@hBlDhA~BZh@h@vAnA|Cp@fBZfAv@bDNz@Hb@l@hD|@fGD^P|BDt@DnAFrAHzBDv@@b@LbC@~@@P?F@fD?^?fA@l@@dABbA?PAdEA|CAdCGlBIfAEtAAZA^?LA\\GlAC`@Ip@AJm@jGaAbKKhA]~CIh@ABMt@{@`Fk@bDj@p@tA`BjBpBXZDD|@Id@Cb@@L@bAHTBz@FP@T?VCzAYrASDd@Fb@AF??CD]PIF}CvC]_@g@k@IH{@x@cAaAmC{CEEY[eEjE|@~@b@h@JLHPFPDTBRLdAFbAJbCDhB@fHBrAAV@P@PBNDNDNFRTh@|AhE^|@^|@LXFRd@zAZ`A@BTp@bAvDH\\DRLl@Hh@Jh@t@dHLlA?@Dd@B`@B\\?l@AnAk@`LU~FAj@@b@@f@@v@@VFt@HlADx@@N@FDr@Bd@@x@?R?^CdAIpBALYzFq@rPE`@G^G^wA~Ek@jBM`@GVCNCXAd@CfBGfAGvACpB@n@?D?n@RlLFtDB`@B^F`@H^H`@l@zB@Hj@rBFVDHL^L`@L\\L^|ArFdArEF\\H\\HZFZJ\\HZLZLXNVLVNVV`@~DpGP\\PXRVpCtD|@jALRTZJRJTFRDRBHFZD\\@Nj@lF?^RbBNfAVpA\\|APx@n@xCLr@FRRj@NTpC`CvAjAf@`@JJtApAtBhBdA|@v@l@f@d@~@fAZ\\DHBHNJPNz@jAlCnDBD@?b@p@r@hAz@[nDoAl@UtAi@fEaBHCt@YxB}@jAc@Qk@EO??DNPj@kAb@yB|@u@XIBgE`BuAh@m@ToDnA{@ZeD~@aFrAe@LSFODFTjGtPVd@R`@TT@DTl@HPN`@Jd@Bf@Ch@G`@IRCHUZMJqC|Au@d@cC|AUXKXA^BPDRj@rBDT^vAFTHPJRNNLPNNjHlH`A`A@BJH|@`AJJhAlA|DtERTNTNVLVJXJVJXHXHZF\\FZDZDXBXD\\B`@Bd@Bd@@f@@~@CpA]`GGf@Gf@If@g@pDgA~HE^E\\E^AZAZCv@InAC`@C`@u@zJC`@A`@C`@?^??Ad@Ab@AjAGhCCb@Eb@Ed@?@E`@Gd@CLCTuA`L?JAJCVATCREd@CNEb@Eb@APCb@?\\G~AAd@AZOfCCvB?BCp@AZ?\\AZFtF?`@?`@A`@?`@?`@?^?^?\\@Z@ZBPTtD?n@Id@Kf@eAzEEPMj@Ox@Cl@BnA?v@@nC@j@Ej@[~B_@fCSv@CTCV?Z?`@?^BLH`@hA|CL^L`@N\\Nd@Tp@Xz@^fANd@Tr@Vt@HTHRDRFZBZ@d@@PBXBVD\\FXHVFRJRNZNXV`@V`@RTLPVVXTXRdDdC`@VPRh@n@Rj@Tr@VhBV|BNhBV`BvAfHNl@Ld@Ld@Lb@JZP`@PZP^PXHTj@hAx@rAt@rA|BjEL^JVFPDNL^bA|C~@nCNb@NXT^PXRVTZVX^XZXRPZTVRXPVNd@Pd@NpEbAZFd@LnCl@v@RRF\\Jl@T|DtAh@Tf@Pb@PZLTLXPRLTRPXNXN`@NVNXP\\PZNZNVRPTPTLPHNFHBJDP@ZBXDLBH?XBTBVBXDPFNDB@TJPLRPNNLXHPHJDRHTFLFPLZJZL\\RbA\\fDF^D\\FXFZFVDXD`@BXB^?\\E`@C\\CHANEPGXGRGRKTKTOTQXSZyAxBcA~Ao@`Ay@nAoAnBg@Ga@MWEWBSH_@RWNSFWAWGoA]sBs@EAo@Sa@U[SWWmBwBoAwAZe@zA{Ah@i@l@m@t@y@j@s@j@e@^?RNx@?jAIb@Ix@Ub@eC[aA^gBo@eDPBLIH]Pk@NUd@q@Z_@NMP?LF\\Rf@ZDDJLQ`@[^YX??XYZ_@Pa@KMEEg@[]SMGQ?OL[^e@p@OTQj@I\\MHQCn@dD_@fBZ`Ac@dCy@Tc@HkAHy@?SO_@?k@d@k@r@u@x@m@l@i@h@{AzA[d@nAvAlBvBVVZR`@Tn@RD@rBr@nA\\VFV@RGVO^SRIVCVD`@LT^OT}@vAOVq@~@o@bA[f@QZORORMRENIREPCNEVANTA^@R@XDVHXFTBFLXNV\\h@xBdDBNp@hAr@fAjAhBv@lAhAhB|@vAz@pAFRV\\v@dAJPJLRVHLJPFTDJ?J@`@@l@Bj@LxDBj@BT@PJp@D^ZzAV`AiAXc@LYFa@H_@Hu@NUBW?_@?_@CK?[A_@@g@Fo@JWD_B\\OB";

const COASTAL_ROAD_DISTANCE = 110_000; // 110 km out-and-back
const COASTAL_ROAD_ELEVATION = 650; // meters

export default function StravaShowcaseRouteMap() {
  return (
    <RouteMap
      polyline={COASTAL_ROAD_POLYLINE}
      distance={COASTAL_ROAD_DISTANCE}
      elevationGain={COASTAL_ROAD_ELEVATION}
      className="rounded-xl shadow-lg"
    />
  );
}
