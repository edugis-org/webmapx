//#region src/utils/epsg-definitions.ts
var e = {
	4326: "+proj=longlat +datum=WGS84 +no_defs",
	28992: "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs",
	31370: "+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs",
	3812: "+proj=lcc +lat_1=49.83333333333334 +lat_2=51.16666666666666 +lat_0=50.797815 +lon_0=4.359215833333333 +x_0=649328 +y_0=665262 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	2154: "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	27572: "+proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=0 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m +no_defs",
	25832: "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	31467: "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs",
	25830: "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	25829: "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	27700: "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs",
	29903: "+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=0.99982 +x_0=600000 +y_0=750000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	2056: "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
	31254: "+proj=tmerc +lat_0=0 +lon_0=10.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs",
	3003: "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs",
	3004: "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs",
	3006: "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	3007: "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	3008: "+proj=tmerc +lat_0=0 +lon_0=13.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	4093: "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.99998 +x_0=200000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5105: "+proj=tmerc +lat_0=58 +lon_0=5.5 +k=1 +x_0=100000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5106: "+proj=tmerc +lat_0=58 +lon_0=6.5 +k=1 +x_0=100000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5107: "+proj=tmerc +lat_0=58 +lon_0=7.5 +k=1 +x_0=100000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5108: "+proj=tmerc +lat_0=58 +lon_0=8.5 +k=1 +x_0=100000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5109: "+proj=tmerc +lat_0=58 +lon_0=9.5 +k=1 +x_0=100000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5110: "+proj=tmerc +lat_0=58 +lon_0=10.5 +k=1 +x_0=100000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	25833: "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	3057: "+proj=lcc +lat_1=64.25 +lat_2=65.75 +lat_0=65 +lon_0=-19 +x_0=500000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5325: "+proj=lcc +lat_1=64.25 +lat_2=65.75 +lat_0=65 +lon_0=-19 +x_0=1700000 +y_0=300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	2180: "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	3763: "+proj=tmerc +lat_0=39.66825833333333 +lon_0=-8.133108333333334 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	5514: "+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813975277778 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs",
	3067: "+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	2100: "+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs",
	23700: "+proj=somerc +lat_0=47.14439372222222 +lon_0=19.04857177777778 +k_0=0.99993 +x_0=650000 +y_0=200000 +ellps=GRS67 +towgs84=52.17,-71.82,-14.9,0,0,0,0 +units=m +no_defs",
	31700: "+proj=sterea +lat_0=46 +lon_0=25 +k=0.99975 +x_0=500000 +y_0=500000 +ellps=krass +towgs84=33.4,-146.6,-76.3,-0.359,-0.053,0.844,-0.84 +units=m +no_defs",
	2263: "+proj=lcc +lat_1=41.03333333333333 +lat_2=40.66666666666666 +lat_0=40.16666666666666 +lon_0=-74 +x_0=300000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
	2230: "+proj=lcc +lat_1=33.9 +lat_2=32.78333333333333 +lat_0=32.16666666666666 +lon_0=-116.25 +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
	2231: "+proj=lcc +lat_1=34.41666666666666 +lat_2=33.86666666666667 +lat_0=33.5 +lon_0=-118 +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
	2778: "+proj=lcc +lat_1=39.71666666666667 +lat_2=40.78333333333333 +lat_0=39.33333333333334 +lon_0=-122 +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
	2285: "+proj=tmerc +lat_0=30.5 +lon_0=-85.83333333333333 +k=0.99996 +x_0=200000.0001016002 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
	2286: "+proj=tmerc +lat_0=30 +lon_0=-87.5 +k=0.999933333 +x_0=600000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
	3081: "+proj=aea +lat_1=27.5 +lat_2=35 +lat_0=18 +lon_0=-100 +x_0=1500000 +y_0=6000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	6350: "+proj=lcc +lat_1=49 +lat_2=45 +lat_0=44.25 +lon_0=-109.5 +x_0=600000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	6339: "+proj=lcc +lat_1=43 +lat_2=40 +lat_0=39.83333333333334 +lon_0=-100 +x_0=500000.00001016 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
	26918: "+proj=utm +zone=18 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26919: "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26910: "+proj=utm +zone=10 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26911: "+proj=utm +zone=11 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26912: "+proj=utm +zone=12 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26913: "+proj=utm +zone=13 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26914: "+proj=utm +zone=14 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26915: "+proj=utm +zone=15 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26916: "+proj=utm +zone=16 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26917: "+proj=utm +zone=17 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	26920: "+proj=utm +zone=20 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	3347: "+proj=lcc +lat_1=49 +lat_2=77 +lat_0=63.390675 +lon_0=-91.86666666666666 +x_0=6200000 +y_0=3000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	28355: "+proj=utm +zone=55 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	2193: "+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	22287: "+proj=tmerc +lat_0=0 +lon_0=27 +k=1 +x_0=0 +y_0=0 +axis=wsu +ellps=clrk80 +towgs84=-136,-108,-292,0,0,0,0 +units=m +no_defs",
	31983: "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	6668: "+proj=utm +zone=54 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	4490: "+proj=longlat +ellps=GRS80 +no_defs",
	7755: "+proj=lcc +lat_1=12.4725 +lat_2=35.1725 +lat_0=23.8225 +lon_0=80.95 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
}, t = [
	{
		code: "28992",
		name: "Amersfoort / RD New",
		bounds: [
			3.2,
			50.7,
			7.3,
			53.6
		],
		proj4: e[28992]
	},
	{
		code: "31370",
		name: "Belge 1972 / Belgian Lambert 72",
		bounds: [
			2.5,
			49.5,
			6.4,
			51.6
		],
		proj4: e[31370]
	},
	{
		code: "3812",
		name: "ETRS89 / Belgian Lambert 2008",
		bounds: [
			2.5,
			49.5,
			6.4,
			51.6
		],
		proj4: e[3812]
	},
	{
		code: "2154",
		name: "RGF93 v1 / Lambert-93",
		bounds: [
			-5.5,
			41,
			10,
			51.5
		],
		proj4: e[2154]
	},
	{
		code: "27572",
		name: "NTF (Paris) / Lambert zone II",
		bounds: [
			-4.9,
			42.3,
			8.3,
			51.1
		],
		proj4: e[27572]
	},
	{
		code: "25832",
		name: "ETRS89 / UTM zone 32N",
		bounds: [
			5.8,
			47.2,
			15.1,
			55.1
		],
		proj4: e[25832]
	},
	{
		code: "31467",
		name: "DHDN / 3-degree Gauss-Kruger zone 3",
		bounds: [
			7.5,
			47.3,
			10.5,
			55.1
		],
		proj4: e[31467]
	},
	{
		code: "25830",
		name: "ETRS89 / UTM zone 30N",
		bounds: [
			-9.5,
			35.9,
			.5,
			43.9
		],
		proj4: e[25830]
	},
	{
		code: "25829",
		name: "ETRS89 / UTM zone 29N",
		bounds: [
			-18.5,
			27.6,
			-6,
			43.9
		],
		proj4: e[25829]
	},
	{
		code: "27700",
		name: "OSGB36 / British National Grid",
		bounds: [
			-8.8,
			49.8,
			2,
			61
		],
		proj4: e[27700]
	},
	{
		code: "29903",
		name: "IRENET95 / Irish Transverse Mercator",
		bounds: [
			-10.7,
			51.4,
			-5.4,
			55.5
		],
		proj4: e[29903]
	},
	{
		code: "2056",
		name: "CH1903+ / LV95",
		bounds: [
			5.9,
			45.8,
			10.6,
			47.9
		],
		proj4: e[2056]
	},
	{
		code: "31254",
		name: "MGI / Austria GK West",
		bounds: [
			9.5,
			46.4,
			17.2,
			49.1
		],
		proj4: e[31254]
	},
	{
		code: "3003",
		name: "Monte Mario / Italy zone 1",
		bounds: [
			6.6,
			35.3,
			18.6,
			47.1
		],
		proj4: e[3003]
	},
	{
		code: "3004",
		name: "Monte Mario / Italy zone 2",
		bounds: [
			11.8,
			36.6,
			18.6,
			47.1
		],
		proj4: e[3004]
	},
	{
		code: "3006",
		name: "SWEREF99 TM",
		bounds: [
			10,
			54.9,
			24.2,
			69.1
		],
		proj4: e[3006]
	},
	{
		code: "3007",
		name: "SWEREF99 12 00",
		bounds: [
			11,
			55,
			13,
			69
		],
		proj4: e[3007]
	},
	{
		code: "3008",
		name: "SWEREF99 13 30",
		bounds: [
			12.5,
			55,
			14.5,
			69
		],
		proj4: e[3008]
	},
	{
		code: "25832",
		name: "ETRS89 / UTM zone 32N",
		bounds: [
			8,
			54.5,
			15.3,
			58
		],
		proj4: e[25832]
	},
	{
		code: "4093",
		name: "ETRS89 / DKTM1",
		bounds: [
			8,
			54.5,
			15.3,
			58
		],
		proj4: e[4093]
	},
	{
		code: "5105",
		name: "EUREF89 NTM zone 5",
		bounds: [
			4.68,
			57.9,
			6.05,
			65.7
		],
		proj4: e[5105]
	},
	{
		code: "5106",
		name: "EUREF89 NTM zone 6",
		bounds: [
			5.68,
			58,
			7.22,
			66.4
		],
		proj4: e[5106]
	},
	{
		code: "5107",
		name: "EUREF89 NTM zone 7",
		bounds: [
			6.68,
			58.1,
			8.45,
			67.3
		],
		proj4: e[5107]
	},
	{
		code: "5108",
		name: "EUREF89 NTM zone 8",
		bounds: [
			7.68,
			58.2,
			9.93,
			68.4
		],
		proj4: e[5108]
	},
	{
		code: "5109",
		name: "EUREF89 NTM zone 9",
		bounds: [
			8.68,
			58.3,
			11.57,
			69.5
		],
		proj4: e[5109]
	},
	{
		code: "5110",
		name: "EUREF89 NTM zone 10",
		bounds: [
			9.68,
			58.4,
			13.9,
			70.9
		],
		proj4: e[5110]
	},
	{
		code: "3057",
		name: "ISN93 / Lambert 1993",
		bounds: [
			-24.7,
			63.3,
			-13.4,
			66.6
		],
		proj4: e[3057]
	},
	{
		code: "5325",
		name: "ISN2004 / Lambert 2004",
		bounds: [
			-24.7,
			63.3,
			-13.4,
			66.6
		],
		proj4: e[5325]
	},
	{
		code: "25833",
		name: "ETRS89 / UTM zone 33N",
		bounds: [
			3,
			57.9,
			31.3,
			71.3
		],
		proj4: e[25833]
	},
	{
		code: "2180",
		name: "ETRS89 / Poland CS92",
		bounds: [
			14.1,
			49,
			24.2,
			55
		],
		proj4: e[2180]
	},
	{
		code: "3763",
		name: "ETRS89 / Portugal TM06",
		bounds: [
			-9.6,
			36.9,
			-6.2,
			42.2
		],
		proj4: e[3763]
	},
	{
		code: "5514",
		name: "S-JTSK / Krovak East North",
		bounds: [
			12,
			48.5,
			18.9,
			51.1
		],
		proj4: e[5514]
	},
	{
		code: "3067",
		name: "ETRS89 / TM35FIN(E,N)",
		bounds: [
			19,
			59.4,
			31.6,
			70.1
		],
		proj4: e[3067]
	},
	{
		code: "2100",
		name: "GGRS87 / Greek Grid",
		bounds: [
			19.5,
			34.8,
			28.3,
			41.8
		],
		proj4: e[2100]
	},
	{
		code: "2263",
		name: "NAD83 / New York Long Island (ftUS)",
		bounds: [
			-74.3,
			40.5,
			-71.8,
			41.3
		],
		proj4: e[2263]
	},
	{
		code: "2230",
		name: "NAD83 / California zone 6 (ftUS)",
		bounds: [
			-118,
			32.5,
			-114.1,
			34.1
		],
		proj4: e[2230]
	},
	{
		code: "2231",
		name: "NAD83 / California zone 5 (ftUS)",
		bounds: [
			-121,
			32.8,
			-117.6,
			35.8
		],
		proj4: e[2231]
	},
	{
		code: "2778",
		name: "NAD83 / California zone 1 (ftUS)",
		bounds: [
			-124.5,
			39.5,
			-120,
			42
		],
		proj4: e[2778]
	},
	{
		code: "2285",
		name: "NAD83 / Florida East (ftUS)",
		bounds: [
			-82,
			24.4,
			-79.9,
			30.8
		],
		proj4: e[2285]
	},
	{
		code: "2286",
		name: "NAD83 / Florida West (ftUS)",
		bounds: [
			-87.6,
			24.4,
			-82,
			31
		],
		proj4: e[2286]
	},
	{
		code: "3081",
		name: "NAD83 / Texas Centric Albers Equal Area",
		bounds: [
			-106.7,
			25.8,
			-93.5,
			36.5
		],
		proj4: e[3081]
	},
	{
		code: "6350",
		name: "NAD83(2011) / Montana",
		bounds: [
			-116.1,
			44.3,
			-104,
			49
		],
		proj4: e[6350]
	},
	{
		code: "6339",
		name: "NAD83(2011) / Nebraska (ftUS)",
		bounds: [
			-104.1,
			40,
			-95.3,
			43
		],
		proj4: e[6339]
	},
	{
		code: "26910",
		name: "NAD83 / UTM zone 10N",
		bounds: [
			-126,
			24,
			-120,
			84
		],
		proj4: e[26910]
	},
	{
		code: "26911",
		name: "NAD83 / UTM zone 11N",
		bounds: [
			-120,
			24,
			-114,
			84
		],
		proj4: e[26911]
	},
	{
		code: "26912",
		name: "NAD83 / UTM zone 12N",
		bounds: [
			-114,
			24,
			-108,
			84
		],
		proj4: e[26912]
	},
	{
		code: "26913",
		name: "NAD83 / UTM zone 13N",
		bounds: [
			-108,
			24,
			-102,
			84
		],
		proj4: e[26913]
	},
	{
		code: "26914",
		name: "NAD83 / UTM zone 14N",
		bounds: [
			-102,
			24,
			-96,
			84
		],
		proj4: e[26914]
	},
	{
		code: "26915",
		name: "NAD83 / UTM zone 15N",
		bounds: [
			-96,
			24,
			-90,
			84
		],
		proj4: e[26915]
	},
	{
		code: "26916",
		name: "NAD83 / UTM zone 16N",
		bounds: [
			-90,
			24,
			-84,
			84
		],
		proj4: e[26916]
	},
	{
		code: "26917",
		name: "NAD83 / UTM zone 17N",
		bounds: [
			-84,
			24,
			-78,
			84
		],
		proj4: e[26917]
	},
	{
		code: "26918",
		name: "NAD83 / UTM zone 18N",
		bounds: [
			-78,
			24,
			-72,
			84
		],
		proj4: e[26918]
	},
	{
		code: "26919",
		name: "NAD83 / UTM zone 19N",
		bounds: [
			-72,
			24,
			-66,
			84
		],
		proj4: e[26919]
	},
	{
		code: "26920",
		name: "NAD83 / UTM zone 20N",
		bounds: [
			-66,
			24,
			-60,
			84
		],
		proj4: e[26920]
	}
];
//#endregion
export { t as n, e as t };
