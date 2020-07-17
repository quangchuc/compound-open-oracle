import {
  computeProfitMaximizingTrade,
  getReserves,
  swapToPrice
} from '../src/uniswap';
import { Whit } from './whit';

function e(n: number | bigint, exp: number | bigint) {
  return BigInt(n) * 10n ** BigInt(exp);
}

describe('computeProfitMaximizingTrade', () => {
  [
    {
      name: "simple",
      truePriceTokenA: e(100, 6),
      truePriceTokenB: e(200, 6),
      reserveA: e(10, 18),
      reserveB: e(21, 18),
      expect: {
        aToB: true,
        amountIn: 20n
      }
    }
  ].forEach((conf) => {
    test(conf.name, async () => {
      let result = computeProfitMaximizingTrade(
        conf.truePriceTokenA,
        conf.truePriceTokenB,
        conf.reserveA,
        conf.reserveB
      );

      expect(result).toEqual(conf.expect);


    });
  });
});

describe('swapToPrice', () => {
  [
    {
      name: "simple",
      reserveA: e(10, 18),
      reserveB: e(10, 18),
      priceA: e(100, 6),
      priceB: e(200, 6),
      maxSpendA: e(100, 18),
      maxSpendB: e(100, 18)
    }
  ].forEach(conf => {
    test.only(conf.name, async () => {

      let whit = await Whit.init({
        provider: 'ganache',
        build: ['./tests/.build/uniswap.json', './tests/.build/compound-test.json'],
        contracts: {
          uniswap: {
            deploy: ['UniswapV2Factory', ["0x871A9FF377eCf2632A0928950dCEb181557F2e17"]]
          },
          abacus: {
            deploy: ['StandardToken', []]
          },
          pair: {
            deploy: async ({uniswap, abacus, babylon}, {ethers, build, provider}) => {
              let pair = await uniswap.createPair(abacus, babylon);

              return new ethers.Contract(pair, build['UniswapPair'].abi, provider);
            },
            postDeploy: async (pair, refs) => {
              await refs.abacus.methods.approve(refs.pair, -1);
              await refs.babylong.methods.approve(refs.pair, -1);
              await pair.addLiquidity(100, 200);
            }
          },
          babylon: {
            deploy: ['StandardToken', []],
          }
        }
      });

      // TODO: Whit?
      // deploy TokenA();
      // deploy TokenB();
      // deploy Uniswap();
      // create Pair
      // Seed Pair
      let tokenSymbolA = "Abacus";
      let tokenSymbolB = "Babylon";
      let tokenA = "0x";
      let tokenB = "0x";
      let factory = "0x";
      let to = "0x"; // ?

      await swapToPrice(
        tokenSymbolA,
        tokenA,
        tokenSymbolB,
        tokenB,
        conf.priceA,
        conf.priceB,
        conf.maxSpendA,
        conf.maxSpendB,
        factory,
        to,
        <any>null // web3
      );

      let [reserveA, reserveB] = await getReserves(factory, tokenA, tokenB, <any>null /* web3 */);

      // TODO: Is this the right expectation?
      expect(reserveA / reserveB).toEqual(conf.priceA / conf.priceB);
    });
  });
});