"""Validate synthetic CSV expenses and optionally post them to the Java API."""
import argparse, csv, json, re, urllib.request, urllib.error
from decimal import Decimal, InvalidOperation
from datetime import date
from pathlib import Path
CATEGORIES = {'FOOD', 'TRANSPORT', 'HOUSING', 'SHOPPING', 'OTHER'}

def validate(row):
    errors = []
    if not re.fullmatch('[A-Za-z0-9_-]{1,64}', row.get('externalId', '')):
        errors.append('invalid externalId')
    try:
        booked = date.fromisoformat(row.get('bookedOn', ''))
        if booked > date.today():
            errors.append('future date')
    except ValueError:
        errors.append('invalid date')
    if not row.get('merchant', '').strip() or len(row.get('merchant', '')) > 100:
        errors.append('invalid merchant')
    if row.get('category') not in CATEGORIES:
        errors.append('invalid category')
    if row.get('currency') != 'CAD':
        errors.append('currency must be CAD')
    try:
        amount = Decimal(row.get('amount', ''))
        if not amount.is_finite() or amount <= 0 or amount > Decimal('9999999999.99') or (amount.as_tuple().exponent < -2):
            errors.append('invalid amount')
    except InvalidOperation:
        errors.append('invalid amount')
    return errors

def prepare(path):
    valid = []
    rejected = []
    seen = set()
    with Path(path).open(newline='', encoding='utf-8-sig') as f:
        for line, row in enumerate(csv.DictReader(f), 2):
            errors = validate(row)
            if row.get('externalId') in seen:
                errors.append('duplicate in CSV')
            if errors:
                rejected.append({'line': line, 'errors': errors})
            else:
                seen.add(row['externalId'])
                valid.append({k: row[k] for k in ['externalId', 'bookedOn', 'merchant', 'category', 'amount', 'currency']})
    return (valid, rejected)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('csv')
    p.add_argument('--submit', action='store_true')
    p.add_argument('--api', default='http://127.0.0.1:8080')
    args = p.parse_args()
    valid, rejected = prepare(args.csv)
    report = {'valid': len(valid), 'rejected': rejected, 'submitted': 0, 'failed': []}
    if args.submit:
        from urllib.parse import urlparse
        url = urlparse(args.api)
        if url.scheme != 'http' or url.hostname not in {'localhost', '127.0.0.1'}:
            p.error('demo submissions are restricted to localhost HTTP')
        for row in valid:
            try:
                req = urllib.request.Request(args.api.rstrip('/') + '/api/transactions', data=json.dumps(row).encode(), headers={'Content-Type': 'application/json'}, method='POST')
                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status == 201:
                        report['submitted'] += 1
            except (urllib.error.URLError, TimeoutError) as e:
                report['failed'].append({'externalId': row['externalId'], 'error': str(e)})
    print(json.dumps(report, indent=2))
    return 1 if rejected or report['failed'] else 0
if __name__ == '__main__':
    raise SystemExit(main())
