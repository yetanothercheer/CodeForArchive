# import glob, os, inspect
# import unittest

# for path in glob.glob("*test*.py"):
#     if path == os.path.basename(__file__):
#         continue
#     module_name = path[:-3]
#     module = __import__(module_name)
#     for v in dir(module):
#         print(f"=== {v}")
#         value = getattr(module, v)
#         if inspect.isclass(value) and issubclass(value, unittest.TestCase):
#             print(f"Loading Test {v} from {module_name}")
#             locals()[v] = value
