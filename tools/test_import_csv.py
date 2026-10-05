import unittest, tempfile
from pathlib import Path
from import_csv import validate, prepare

class ImportTests(unittest.TestCase):

    def row(self, **changes):
        return dict(externalId='A', bookedOn='2020-01-01', merchant='Demo', category='FOOD', amount='0.10', currency='CAD', **{}) | changes

    def test_valid(self):
        self.assertEqual(validate(self.row()), [])

    def test_bad_amounts(self):
        for amount in ['0', '-1', 'NaN', 'Infinity', '1.001', '10000000000', 'abc']:
            self.assertTrue(validate(self.row(amount=amount)), amount)

    def test_fields(self):
        for change in [dict(currency='USD'), dict(category='bad'), dict(bookedOn='2999-01-01'), dict(merchant=' '), dict(externalId='bad id')]:
            self.assertTrue(validate(self.row(**change)))

    def test_duplicate_and_invalid_rows(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'input.csv'
            p.write_text('externalId,bookedOn,merchant,category,amount,currency\nA,2020-01-01,Demo,FOOD,1.00,CAD\nA,2020-01-01,Demo,FOOD,2.00,CAD\nB,2020-01-01,Demo,FOOD,-1,CAD\n')
            v, r = prepare(p)
            self.assertEqual(len(v), 1)
            self.assertEqual(len(r), 2)
if __name__ == '__main__':
    unittest.main()
