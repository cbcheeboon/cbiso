var BIT_COUNT = 8; // 8 bits represent 1 byte
var BYTE_HEX_COUNT = 2; // 2 hex ASCII represents 1 byte

/**
 * @param {number} which  one-based index, e.g. 1 means field 1
 * @param {string} value  text that was extracted as-is
 * @param {number} len  len of var-len field, or null if fixed-len field
 * @param {string} ascii  ASCII decoded from text, or null for non-applicable field
 */
function Field(which, value, len, ascii) {
	if (which === undefined) {
		throw "'which' must be defined when creating Field!";
	}
	this.which = which;
	this.value = value === undefined ? "" : value;
	this.len = len === undefined ? 0 : len;
	this.ascii = ascii === undefined ? "" : ascii;
}

function log_offending_field(field) {
	console.log("offending field", field);
}

/**
 * @param {string} szBmp  hex text of Bitmap
 * @param {number} cbBmp  char count
 * @returns {Field[]}  Field[] with 'which' defined
 */
function decode_bitmap_for_fields(szBmp, cbBmp) {
	var fields = [];
	var i = 0, j = 0;
	var bmpByteHex = "";
	var bmpByte = 0;
	for (i = 0; i < cbBmp; ++i) {
		bmpByteHex = szBmp.substr(i * BYTE_HEX_COUNT, BYTE_HEX_COUNT);
		bmpByte = parseInt(bmpByteHex, 16);
		for (j = BIT_COUNT; j-- > 0;) {
			if (bmpByte & (1 << j)) {
				fields.push(new Field(
					i * BIT_COUNT + (BIT_COUNT - j)
				));
			}
		}
	}
	return fields;
}

/**
 * @param {Field[]} fields  Field[] with 'which' defined
 * @param {string} szDump  text after Bitmap
 * @return {void}  Field[] with 'value' filled
 */
function fill_fields_from_dump(fields, szDump) {
	var i = 0;
	var ffs = { // object ffs (fill_field state)
		szDump: szDump
	};
	for (i = 0; i < fields.length; ++i) {
		ffs.szVal = "";
		ffs.len = null;
		ffs.szAscii = null;
		switch (fields[i].which) {
		case 1: // b 64
			log_offending_field(fields[i]);
			throw "Second Bitmap field handler not implemented.";
		case 2: // n..19
			fill_field_n_var(19, ffs);
			break;
		case 3: // n 6
			fill_field_n(6, ffs);
			break;
		case 4: // n 12
		case 5:
		case 6:
			fill_field_n(12, ffs);
			break;
		case 7: // n 10
			fill_field_n(10, ffs);
			break;
		case 8: // n 8
		case 9:
		case 10:
			fill_field_n(8, ffs);
			break;
		case 11: // n 6
		case 12:
			fill_field_n(6, ffs);
			break;
		case 13: // n 4
		case 14:
		case 15:
		case 16:
		case 17:
		case 18:
			fill_field_n(4, ffs);
			break;
		case 19: // n 3
		case 20:
		case 21:
		case 22:
		case 23:
		case 24:
			fill_field_n(3, ffs);
			break;
		case 25: // n 2
		case 26:
			fill_field_n(2, ffs);
			break;
		case 27: // n 1
			fill_field_n(1, ffs);
			break;
		case 28: // x+n 8
		case 29:
		case 30:
		case 31:
			log_offending_field(fields[i]);
			throw "x+n field handler not implemented.";
		case 32: // n..11
		case 33:
			fill_field_n_var(11, ffs);
			break;
		case 34: // ns..28
			fill_field_ns_var(28, ffs);
			break;
		case 35: // z..37
			fill_field_z_var(37, ffs);
			break;
		case 36: // n...104
			fill_field_n_var(104, ffs);
			break;
		case 37: // an 12
			fill_field_an(12, ffs);
			break;
		case 38: // an 6
			fill_field_an(6, ffs);
			break;
		case 39: // an 2
			fill_field_an(2, ffs);
			break;
		case 40: // an 3
			fill_field_an(3, ffs);
			break;
		case 41: // ans 8
			fill_field_ans(8, ffs);
			break;
		case 42: // ans 15
			fill_field_ans(15, ffs);
			break;
		case 43: // ans 40
			fill_field_ans(40, ffs);
			break;
		case 44: // an..25
			fill_field_an_var(25, ffs);
			break;
		case 45: // an..76
			fill_field_an_var(76, ffs);
			break;
		case 46: // an...999
		case 47:
		case 48:
			fill_field_an_var(999, ffs);
			break;
		case 49: // a or n 3 ???
		case 50:
		case 51:
			log_offending_field(fields[i]);
			throw "Field 49/50/51 handler is not implemented.\n"
				+ "Field spec is ambiguous, not sure how to handle.";
		case 52: // b 64
			fill_field_b(64, ffs);
			break;
		case 53: // n 16
			fill_field_n(16, ffs);
			break;
		case 54: // an...120
			fill_field_an_var(120, ffs);
			break;
		case 55: // ans...999
		case 56:
		case 57:
		case 58:
		case 59:
		case 60:
		case 61:
		case 62:
		case 63:
			fill_field_ans_var(999, ffs);
			break;
		case 64: // b 64
			fill_field_b(64, ffs);
			break;
		default:
			log_offending_field(fields[i]);
			throw "Unexpected case (field.which).";
		}
		fields[i].len = ffs.len;
		fields[i].value = ffs.szVal;
		fields[i].ascii = ffs.szAscii;
	}
}

// for fill_field_* functions
//  IN: count (fixed) or maxCount (variable)
//  IN: object ffs { pre-process szDump, undefined szVal & len }
// OUT: object ffs { post-process szDump, defined szVal & len }
// RETURN VOID

function fill_field_an(count, ffs) {
	fill_ffs_val(count * BYTE_HEX_COUNT, ffs);
	fill_ffs_ascii(ffs);
}

function fill_field_an_var(maxCount, ffs) {
	fill_ffs_len(maxCount, ffs);
	fill_ffs_val(ffs.len * BYTE_HEX_COUNT, ffs);
	fill_ffs_ascii(ffs);
}

function fill_field_ans(count, ffs) {
	fill_ffs_val(count * BYTE_HEX_COUNT, ffs);
	fill_ffs_ascii(ffs);
}

function fill_field_ans_var(maxCount, ffs) {
	fill_ffs_len(maxCount, ffs);
	fill_ffs_val(ffs.len * BYTE_HEX_COUNT, ffs);
	fill_ffs_ascii(ffs);
}

function fill_field_b(count, ffs) {
	fill_ffs_val(count * BYTE_HEX_COUNT, ffs);
}

function fill_field_n(count, ffs) {
	fill_ffs_val(count, ffs);
}

function fill_field_n_var(maxCount, ffs) {
	fill_ffs_len(maxCount, ffs);
	fill_ffs_val(ffs.len, ffs);
}

function fill_field_ns_var(maxCount, ffs) {
	fill_ffs_len(maxCount, ffs);
	fill_ffs_val(ffs.len * BYTE_HEX_COUNT, ffs);
	fill_ffs_ascii(ffs);
}

function fill_field_z_var(maxCount, ffs) {
	fill_ffs_len(maxCount, ffs);
	fill_ffs_val(ffs.len, ffs);
}

/**
 * @param {number} maxCount  max length of field
 * @param {object} ffs  fill_field_state with 'szDump' defined
 * @returns {void} ffs with 'len' defined, 'szDump' mutated
 */
function fill_ffs_len(maxCount, ffs) {
	var cbEat = 0;
	var iSubstr = 0, nSubstr = 0;
	if (maxCount > 999) {
		throw "Field maxCount must not exceed 999.";
	}
	else if (maxCount > 99) {
		cbEat = 4; iSubstr = 1; nSubstr = 3;
	}
	else if (maxCount > 9) {
		cbEat = 2; iSubstr = 0; nSubstr = 2;
	}
	else {
		cbEat = 2; iSubstr = 1; nSubstr = 1;
	}
	ffs.len = parseInt(ffs.szDump.substr(iSubstr, nSubstr), 10);
	ffs.szDump = ffs.szDump.substr(cbEat);
}

/**
 * @param {number} count  value length of field
 * @param {object} ffs  fill_field_state with 'szDump' defined
 * @returns {void}  ffs with 'szVal' defined, 'szDump' mutated
 */
function fill_ffs_val(count, ffs) {
	var isOdd = (count % 2 == 1);
	if (isOdd) {
		count += 1;
	}
	ffs.szVal = ffs.szDump.substr(0, count);
	if (isOdd) {
		// CardBiz pad zero at left
		// mean "123" is encoded as "0123"
		// so we decode "0123" as "123"
		ffs.szVal = ffs.szVal.substr(1);
	}
	ffs.szDump = ffs.szDump.substr(count);
}

/**
 * @param {object} ffs  fill_field_state with 'szVal' defined
 * @returns {void}  ffs with 'szAscii' defined
 */
function fill_ffs_ascii(ffs) {
	var i = 0;
	var szVal = ffs.szVal;
	var byteHex = "", ascii = "";
	for (i = 0; i < szVal.length / BYTE_HEX_COUNT; ++i) {
		byteHex = szVal.substr(i * BYTE_HEX_COUNT, BYTE_HEX_COUNT);
		ascii += String.fromCharCode(parseInt(byteHex, 16));
	}
	ffs.szAscii = ascii;
}

function show_result(szHdr, szMTI, szBmp, fields) {
	var i = 0, ele = null, eleHost = null;
	var $Fields = document.getElementById("DecodedFields");
	$Fields.innerHTML = "";
	for (i = 0; i < fields.length; ++i) {
		eleHost = document.createElement("div");
		eleHost.className = "DecodedField";
		ele = document.createElement("h1");
		ele.innerText = "Field " + fields[i].which;
		eleHost.append(ele);
		ele = document.createElement("h2");
		ele.innerText = "Value: " + fields[i].value;
		eleHost.append(ele);
		if (fields[i].ascii !== null) {
			ele = document.createElement("h2");
			ele.innerText = "ASCII: " + fields[i].ascii;
			eleHost.append(ele);
		}
		$Fields.append(eleHost);
	}
	document.getElementById("dHdr").innerText = szHdr;
	document.getElementById("dMTI").innerText = szMTI;
	document.getElementById("dBmp").innerText = szBmp;
}

function go_decode_txtISO() {
	var szRaw = document.getElementById("txtISO").value
		.replace(/[ \t\r\n]+/g, "");
	var cbBmp = 64 / BIT_COUNT;
	var szHdr = szRaw.substr(0, 10);
	var szMTI = szRaw.substr(10, 4);
	var szBmp = szRaw.substr(14, cbBmp * 2);
	var fields = decode_bitmap_for_fields(szBmp, cbBmp);
	fill_fields_from_dump(fields, szRaw.substr(14 + cbBmp * 2));
	show_result(szHdr, szMTI, szBmp, fields);
}
